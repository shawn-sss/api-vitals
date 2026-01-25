package com.apivitals.health;

public record HealthCheckDefinition(
        String id,
        String name,
        String url,
        int expectedStatusMin,
        int expectedStatusMax,
        long latencyWarnMs
) {
    public static HealthCheckDefinition basic(String id, String name, String url) {
        return new HealthCheckDefinition(id, name, url, 200, 299, 1000);
    }

    public boolean isExpectedStatus(int status) {
        return status >= expectedStatusMin && status <= expectedStatusMax;
    }

    public boolean isLatencyDegraded(long latencyMs) {
        return latencyWarnMs > 0 && latencyMs > latencyWarnMs;
    }
}
