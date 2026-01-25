package com.apivitals.health;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.stereotype.Component;

import static com.apivitals.health.HealthCheckConstants.*;

@Component
public class HealthCheckHttpClient {
    
    private final HttpClient httpClient;
    
    public HealthCheckHttpClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(CONNECT_TIMEOUT_SECONDS))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }
    
    public HttpResponse<String> performHealthCheck(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                .header("User-Agent", USER_AGENT)
                .GET()
                .build();
        
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
