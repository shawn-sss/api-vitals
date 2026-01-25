package com.apivitals.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.apivitals.health.HealthCheckDefinition;
import com.apivitals.health.HealthCheckResult;
import com.apivitals.health.HealthCheckService;
import com.apivitals.health.dto.HealthCheckUpdate;
import com.apivitals.health.dto.SimulatedCheckRequest;
import com.apivitals.health.dto.SimulatedStateRequest;
import com.apivitals.health.exception.HealthCheckNotFoundException;
import com.apivitals.health.exception.HealthCheckValidationException;
import com.apivitals.health.simulated.SimulatedCheckConfig;
import com.apivitals.health.simulated.SimulatedState;

@RestController
@RequestMapping("/api")
public class HealthApiController {

    private final HealthCheckService healthCheckService;

    public HealthApiController(HealthCheckService healthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    @GetMapping("/checks")
    public List<HealthCheckResult> getHealthChecks() {
        return healthCheckService.runChecks();
    }

    @GetMapping("/definitions")
    public List<HealthCheckDefinition> listDefinitions() {
        return healthCheckService.listDefinitions();
    }

    @PostMapping("/definitions")
    public HealthCheckDefinition addDefinition(@RequestBody HealthCheckUpdate request) {
        try {
            return healthCheckService.addDefinition(request);
        } catch (HealthCheckValidationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PutMapping("/definitions/{id}")
    public HealthCheckDefinition updateDefinition(@PathVariable String id, @RequestBody HealthCheckUpdate request) {
        try {
            return healthCheckService.updateDefinition(id, request);
        } catch (HealthCheckNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        } catch (HealthCheckValidationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @DeleteMapping("/definitions/{id}")
    public void deleteDefinition(@PathVariable String id) {
        try {
            healthCheckService.deleteDefinition(id);
        } catch (HealthCheckNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        } catch (HealthCheckValidationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @GetMapping("/simulated")
    public SimulatedCheckConfig getSimulatedConfig() {
        return healthCheckService.getSimulatedConfig();
    }

    @PostMapping("/simulated")
    public SimulatedCheckConfig updateSimulatedConfig(@RequestBody SimulatedCheckRequest request) {
        return healthCheckService.updateSimulatedConfig(request.mode(), request.latencyMs(), request.statusCode());
    }

    @GetMapping("/simulated/state")
    public SimulatedState getSimulatedState() {
        return healthCheckService.getSimulatedState();
    }

    @PostMapping("/simulated/state")
    public SimulatedState updateSimulatedState(@RequestBody SimulatedStateRequest request) {
        return healthCheckService.setSimulatedEnabled(request.enabled());
    }

    @PostMapping("/reset")
    public void resetAll() {
        healthCheckService.resetAll();
    }
}
