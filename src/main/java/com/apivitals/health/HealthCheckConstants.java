package com.apivitals.health;

public final class HealthCheckConstants {
    
    
    private HealthCheckConstants() {}
    
    
    public static final String SIMULATED_ID = "simulated";
    public static final String DEFAULT_SIMULATED_NAME = "Simulated API";
    public static final String DEFAULT_SIMULATED_URL = "simulated://demo";
    
    
    public static final String MODE_UP = "UP";
    public static final String MODE_DEGRADED = "DEGRADED";
    public static final String MODE_DOWN = "DOWN";
    public static final String MODE_ERROR = "ERROR";
    
    
    public static final int DEFAULT_STATUS_MIN = 200;
    public static final int DEFAULT_STATUS_MAX = 299;
    public static final long DEFAULT_LATENCY_WARN_MS = 1000L;
    
    
    public static final String USER_AGENT = "APIVitals-HealthMonitor/1.0";
    public static final int CONNECT_TIMEOUT_SECONDS = 3;
    public static final int REQUEST_TIMEOUT_SECONDS = 4;
    
    
    public static final int MIN_HTTP_STATUS = 100;
    public static final int MAX_HTTP_STATUS = 599;
    
    
    public static final long SIMULATED_CONTENT_LENGTH = 512L;
    public static final String SIMULATED_PROTOCOL = "HTTP_1_1";
    public static final String SIMULATED_CONTENT_TYPE = "application/json";
}
