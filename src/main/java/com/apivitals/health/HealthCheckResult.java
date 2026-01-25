package com.apivitals.health;

public record HealthCheckResult(
        String id,
        String name,
        String url,
        HealthStatus status,
        boolean up,
        Integer statusCode,
        String finalUrl,
        String protocol,
        String contentType,
        Long contentLength,
        long latencyMs,
        Long latencySlaMs,
        java.time.Instant checkedAt,
        String error,
        String responseBody
) {}
