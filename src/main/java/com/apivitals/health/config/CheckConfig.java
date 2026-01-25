package com.apivitals.health.config;

public class CheckConfig {
    private String id;
    private String name;
    private String url;
    private Integer expectedStatusMin;
    private Integer expectedStatusMax;
    private Long latencyWarnMs;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Integer getExpectedStatusMin() {
        return expectedStatusMin;
    }

    public void setExpectedStatusMin(Integer expectedStatusMin) {
        this.expectedStatusMin = expectedStatusMin;
    }

    public Integer getExpectedStatusMax() {
        return expectedStatusMax;
    }

    public void setExpectedStatusMax(Integer expectedStatusMax) {
        this.expectedStatusMax = expectedStatusMax;
    }

    public Long getLatencyWarnMs() {
        return latencyWarnMs;
    }

    public void setLatencyWarnMs(Long latencyWarnMs) {
        this.latencyWarnMs = latencyWarnMs;
    }
}
