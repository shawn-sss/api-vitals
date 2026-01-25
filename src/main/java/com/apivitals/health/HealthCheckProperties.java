package com.apivitals.health;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.apivitals.health.config.CheckConfig;
import com.apivitals.health.config.SimulatedConfig;

@ConfigurationProperties(prefix = "app.health")
public class HealthCheckProperties {

    private List<CheckConfig> defaults = new ArrayList<>();
    private SimulatedConfig simulated = new SimulatedConfig();

    public List<CheckConfig> getDefaults() {
        return defaults;
    }

    public void setDefaults(List<CheckConfig> defaults) {
        this.defaults = defaults;
    }

    public SimulatedConfig getSimulated() {
        return simulated;
    }

    public void setSimulated(SimulatedConfig simulated) {
        this.simulated = simulated;
    }
}
