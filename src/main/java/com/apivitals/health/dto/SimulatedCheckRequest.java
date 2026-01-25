package com.apivitals.health.dto;

public record SimulatedCheckRequest(String mode, Long latencyMs, Integer statusCode) {}
