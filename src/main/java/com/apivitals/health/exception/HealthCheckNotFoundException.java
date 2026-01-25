package com.apivitals.health.exception;

public class HealthCheckNotFoundException extends RuntimeException {
    
    public HealthCheckNotFoundException(String message) {
        super(message);
    }
    
    public HealthCheckNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
