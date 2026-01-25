package com.apivitals.health;

import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Service;

import com.apivitals.health.dto.HealthCheckUpdate;
import com.apivitals.health.exception.HealthCheckNotFoundException;
import com.apivitals.health.exception.HealthCheckValidationException;
import com.apivitals.health.simulated.SimulatedCheckConfig;
import com.apivitals.health.simulated.SimulatedState;
import com.apivitals.health.util.IdGenerator;

import static com.apivitals.health.HealthCheckConstants.*;

@Service
public class HealthCheckService {

    private final HealthCheckHttpClient httpClient;
    private final List<HealthCheckDefinition> defaultChecks;
    private final List<HealthCheckDefinition> checks;
    private final HealthCheckDefinition simulatedDefinition;

    private final AtomicReference<SimulatedCheckConfig> simulatedConfig;
    private final AtomicBoolean simulatedEnabled;
    private final SimulatedCheckConfig defaultSimulatedConfig;
    private final boolean defaultSimulatedEnabled;

    public HealthCheckService(HealthCheckProperties properties, HealthCheckHttpClient httpClient) {
        this.httpClient = httpClient;
        this.defaultChecks = buildDefaultChecks(properties);
        this.checks = new CopyOnWriteArrayList<>(defaultChecks);
        this.simulatedDefinition = HealthCheckDefinition.basic(SIMULATED_ID, DEFAULT_SIMULATED_NAME, DEFAULT_SIMULATED_URL);
        com.apivitals.health.config.SimulatedConfig simulatedDefaults = properties.getSimulated();
        this.defaultSimulatedConfig = new SimulatedCheckConfig(
                normalizeSimulatedMode(simulatedDefaults.getMode(), MODE_UP),
                Math.max(0L, simulatedDefaults.getLatencyMs()),
                simulatedDefaults.getStatusCode()
        );
        this.defaultSimulatedEnabled = simulatedDefaults.isEnabled();
        this.simulatedConfig = new AtomicReference<>(defaultSimulatedConfig);
        this.simulatedEnabled = new AtomicBoolean(defaultSimulatedEnabled);
    }

    public List<HealthCheckResult> runChecks() {
        List<HealthCheckDefinition> snapshot = new ArrayList<>(checks);
        if (simulatedEnabled.get()) {
            snapshot.add(simulatedDefinition);
        }
        return snapshot.stream()
                .map(this::runCheck)
                .toList();
    }

    public List<HealthCheckDefinition> listDefinitions() {
        return List.copyOf(checks);
    }

    public HealthCheckDefinition addDefinition(HealthCheckUpdate update) {
        HealthCheckUpdate normalized = normalizeUpdate(update);
        String id = normalized.id();
        if (id == null || id.isBlank()) {
            Set<String> existingIds = checks.stream().map(HealthCheckDefinition::id).collect(java.util.stream.Collectors.toSet());
            id = IdGenerator.generateUniqueId(normalized.name(), normalized.url(), existingIds);
        }
        ensureIdAvailable(id);
        HealthCheckDefinition definition = toDefinition(id, normalized, null);
        checks.add(definition);
        return definition;
    }

    public HealthCheckDefinition updateDefinition(String id, HealthCheckUpdate update) {
        HealthCheckUpdate normalized = normalizeUpdate(update);
        HealthCheckDefinition existing = findDefinition(id);
        HealthCheckDefinition updated = toDefinition(id, normalized, existing);
        replaceDefinition(id, updated);
        return updated;
    }

    public void deleteDefinition(String id) {
        if (SIMULATED_ID.equals(id)) {
            throw new HealthCheckValidationException("Simulated API cannot be removed.");
        }
        boolean removed = checks.removeIf(def -> Objects.equals(def.id(), id));
        if (!removed) {
            throw new HealthCheckNotFoundException("Unknown API id.");
        }
    }

    public SimulatedCheckConfig getSimulatedConfig() {
        return simulatedConfig.get();
    }

    public SimulatedState getSimulatedState() {
        return new SimulatedState(simulatedEnabled.get());
    }

    public SimulatedState setSimulatedEnabled(boolean enabled) {
        simulatedEnabled.set(enabled);
        return new SimulatedState(enabled);
    }

    public SimulatedCheckConfig updateSimulatedConfig(String mode, Long latencyMs, Integer statusCode) {
        String normalizedMode = normalizeSimulatedMode(mode, simulatedConfig.get().mode());
        long normalizedLatency = latencyMs == null ? simulatedConfig.get().latencyMs() : Math.max(0L, latencyMs);
        Integer normalizedStatus = statusCode;
        if (normalizedStatus != null && (normalizedStatus < 100 || normalizedStatus > 599)) {
            normalizedStatus = null;
        }
        if (MODE_ERROR.equals(normalizedMode)) {
            normalizedStatus = null;
        }
        if (MODE_DOWN.equals(normalizedMode) && normalizedStatus == null) {
            normalizedStatus = 503;
        }
        SimulatedCheckConfig updated = new SimulatedCheckConfig(normalizedMode, normalizedLatency, normalizedStatus);
        simulatedConfig.set(updated);
        return updated;
    }

    public void resetAll() {
        checks.clear();
        checks.addAll(defaultChecks);
        simulatedConfig.set(defaultSimulatedConfig);
        simulatedEnabled.set(defaultSimulatedEnabled);
    }

    private HealthCheckResult runCheck(HealthCheckDefinition definition) {
        if (SIMULATED_ID.equals(definition.id())) {
            return runSimulatedCheck(definition);
        }
        long start = System.nanoTime();
        try {
            HttpResponse<String> response = httpClient.performHealthCheck(definition.url());
            int statusCode = response.statusCode();
            long latency = Duration.ofNanos(System.nanoTime() - start).toMillis();
            String finalUrl = response.uri() != null ? response.uri().toString() : definition.url();
            String protocol = response.version() != null ? response.version().toString() : null;
            String contentType = response.headers().firstValue("Content-Type").orElse(null);
            String responseBody = truncateResponseBody(response.body());
            Long contentLength = (long) (response.body() != null ? response.body().length() : 0);
            boolean expectedStatus = definition.isExpectedStatus(statusCode);
            boolean degraded = expectedStatus && definition.isLatencyDegraded(latency);
            HealthStatus status = expectedStatus ? (degraded ? HealthStatus.DEGRADED : HealthStatus.UP) : HealthStatus.DOWN;
            String error = null;
            if (!expectedStatus) {
                error = "Unexpected status " + statusCode;
            } else if (degraded) {
                error = "Latency above " + definition.latencyWarnMs() + "ms";
            }
            boolean up = status == HealthStatus.UP || status == HealthStatus.DEGRADED;
            return new HealthCheckResult(
                    definition.id(),
                    definition.name(),
                    definition.url(),
                    status,
                    up,
                    statusCode,
                    finalUrl,
                    protocol,
                    contentType,
                    contentLength,
                    latency,
                    definition.latencyWarnMs(),
                    Instant.now(),
                    error,
                    responseBody
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            long latency = Duration.ofNanos(System.nanoTime() - start).toMillis();
            return new HealthCheckResult(
                    definition.id(),
                    definition.name(),
                    definition.url(),
                    HealthStatus.ERROR,
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    latency,
                    definition.latencyWarnMs(),
                    Instant.now(),
                    "Interrupted",
                    null
            );
        } catch (Exception ex) {
            long latency = Duration.ofNanos(System.nanoTime() - start).toMillis();
            String errorMsg = ex.getClass().getSimpleName();
            if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
                errorMsg += ": " + ex.getMessage();
            }
            return new HealthCheckResult(
                    definition.id(),
                    definition.name(),
                    definition.url(),
                    HealthStatus.ERROR,
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    latency,
                    definition.latencyWarnMs(),
                    Instant.now(),
                    errorMsg,
                    null
            );
        }
    }

    private HealthCheckResult runSimulatedCheck(HealthCheckDefinition definition) {
        SimulatedCheckConfig config = simulatedConfig.get();
        long latencyMs = config.latencyMs();
        String mode = config.mode();
        Integer statusCode = config.statusCode();

        if (MODE_ERROR.equals(mode)) {
            return new HealthCheckResult(
                    definition.id(),
                    definition.name(),
                    definition.url(),
                    HealthStatus.ERROR,
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    latencyMs,
                    definition.latencyWarnMs(),
                    Instant.now(),
                    "Simulated exception",
                    null
            );
        }

        int resolvedStatus = statusCode != null ? statusCode : 200;
        boolean expectedStatus = definition.isExpectedStatus(resolvedStatus);
        boolean degraded = MODE_DEGRADED.equals(mode) || (expectedStatus && definition.isLatencyDegraded(latencyMs));
        HealthStatus status;
        String error = null;

        if (MODE_DOWN.equals(mode)) {
            status = HealthStatus.DOWN;
            error = "Simulated outage";
        } else if (!expectedStatus) {
            status = HealthStatus.DOWN;
            error = "Unexpected status " + resolvedStatus;
        } else if (degraded) {
            status = HealthStatus.DEGRADED;
            error = "Latency above " + definition.latencyWarnMs() + "ms";
        } else {
            status = HealthStatus.UP;
        }

        boolean up = status == HealthStatus.UP || status == HealthStatus.DEGRADED;
        String simulatedBody = "{\"status\":\"" + status + "\",\"timestamp\":\"" + Instant.now() + "\",\"message\":\"Simulated response\"}";
        return new HealthCheckResult(
                definition.id(),
                definition.name(),
                definition.url(),
                status,
                up,
                resolvedStatus,
                definition.url(),
                SIMULATED_PROTOCOL,
                SIMULATED_CONTENT_TYPE,
                SIMULATED_CONTENT_LENGTH,
                latencyMs,
                definition.latencyWarnMs(),
                Instant.now(),
                error,
                simulatedBody
        );
    }

    private String normalizeSimulatedMode(String mode, String fallback) {
        if (mode == null || mode.isBlank()) {
            return fallback;
        }
        String normalized = mode.trim().toUpperCase();
        return switch (normalized) {
            case MODE_UP, MODE_DEGRADED, MODE_DOWN, MODE_ERROR -> normalized;
            default -> fallback;
        };
    }

    private String truncateResponseBody(String body) {
        return body;
    }

    private HealthCheckDefinition findDefinition(String id) {
        return checks.stream()
                .filter(def -> Objects.equals(def.id(), id))
                .findFirst()
                .orElseThrow(() -> new HealthCheckNotFoundException("Unknown API id."));
    }

    private void replaceDefinition(String id, HealthCheckDefinition updated) {
        for (int i = 0; i < checks.size(); i++) {
            if (Objects.equals(checks.get(i).id(), id)) {
                checks.set(i, updated);
                return;
            }
        }
        throw new HealthCheckNotFoundException("Unknown API id.");
    }

    private HealthCheckUpdate normalizeUpdate(HealthCheckUpdate update) {
        if (update == null) {
            throw new HealthCheckValidationException("Missing request body.");
        }
        String name = update.name();
        String url = update.url();
        if (name != null && name.isBlank()) {
            name = null;
        }
        if (url != null && url.isBlank()) {
            url = null;
        }
        Integer min = update.expectedStatusMin();
        Integer max = update.expectedStatusMax();
        Long latency = update.latencyWarnMs();
        if (latency != null && latency < 0) {
            latency = 0L;
        }
        return new HealthCheckUpdate(update.id(), name, url, min, max, latency);
    }

    private HealthCheckDefinition toDefinition(String id, HealthCheckUpdate update, HealthCheckDefinition existing) {
        String name = update.name() != null ? update.name() : existing != null ? existing.name() : null;
        String url = update.url() != null ? update.url() : existing != null ? existing.url() : null;
        if (name == null || url == null) {
            throw new HealthCheckValidationException("Name and url are required.");
        }
        int min = update.expectedStatusMin() != null ? update.expectedStatusMin()
                : existing != null ? existing.expectedStatusMin() : DEFAULT_STATUS_MIN;
        int max = update.expectedStatusMax() != null ? update.expectedStatusMax()
                : existing != null ? existing.expectedStatusMax() : DEFAULT_STATUS_MAX;
        long latency = update.latencyWarnMs() != null ? update.latencyWarnMs()
                : existing != null ? existing.latencyWarnMs() : DEFAULT_LATENCY_WARN_MS;
        if (min < MIN_HTTP_STATUS || max > MAX_HTTP_STATUS || min > max) {
            throw new HealthCheckValidationException("Expected status range must be between " + MIN_HTTP_STATUS + " and " + MAX_HTTP_STATUS + ".");
        }
        return new HealthCheckDefinition(id, name, url, min, max, latency);
    }

    private void ensureIdAvailable(String id) {
        if (SIMULATED_ID.equals(id)) {
            throw new HealthCheckValidationException("Simulated id is reserved.");
        }
        if (idExists(id)) {
            throw new HealthCheckValidationException("API id already exists.");
        }
    }

    private boolean idExists(String id) {
        return checks.stream().anyMatch(def -> Objects.equals(def.id(), id));
    }

    private List<HealthCheckDefinition> buildDefaultChecks(HealthCheckProperties properties) {
        List<HealthCheckDefinition> result = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (com.apivitals.health.config.CheckConfig check : properties.getDefaults()) {
            String id = check.getId();
            String name = check.getName();
            String url = check.getUrl();
            if (name == null || url == null) {
                throw new HealthCheckValidationException("Default health checks require name and url.");
            }
            int min = check.getExpectedStatusMin() != null ? check.getExpectedStatusMin() : DEFAULT_STATUS_MIN;
            int max = check.getExpectedStatusMax() != null ? check.getExpectedStatusMax() : DEFAULT_STATUS_MAX;
            long latency = check.getLatencyWarnMs() != null ? check.getLatencyWarnMs() : DEFAULT_LATENCY_WARN_MS;
            String resolvedId = (id == null || id.isBlank()) ? IdGenerator.generateUniqueId(name, url, ids) : id;
            if (!ids.add(resolvedId)) {
                throw new HealthCheckValidationException("Duplicate default health check id: " + resolvedId);
            }
            result.add(new HealthCheckDefinition(resolvedId, name, url, min, max, latency));
        }
        return List.copyOf(result);
    }
}