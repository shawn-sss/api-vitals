package com.apivitals.health.dto;

public record HealthCheckUpdate(
        String id,
        String name,
        String url,
        Integer expectedStatusMin,
        Integer expectedStatusMax,
        Long latencyWarnMs
) {}
