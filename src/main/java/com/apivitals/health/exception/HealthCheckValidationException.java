package com.apivitals.health.exception;

public class HealthCheckValidationException extends RuntimeException {
    
    public HealthCheckValidationException(String message) {
        super(message);
    }
    
    public HealthCheckValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
