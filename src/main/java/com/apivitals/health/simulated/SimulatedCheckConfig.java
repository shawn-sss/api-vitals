package com.apivitals.health.simulated;

public record SimulatedCheckConfig(String mode, long latencyMs, Integer statusCode) {}
