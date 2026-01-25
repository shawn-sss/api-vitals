

(function () {
  var listBody = document.querySelector('[data-health-list]');
  var refreshButton = document.querySelector('[data-health-refresh]');
  var summary = document.querySelector('[data-health-summary]');
  var summaryDot = document.querySelector('[data-health-summary-dot]');
  var timestamp = document.querySelector('[data-health-timestamp]');
  var banner = document.querySelector('[data-health-banner]');
  var bannerTitle = document.querySelector('[data-health-banner-title]');
  var bannerSubtitle = document.querySelector('[data-health-banner-subtitle]');
  var totalEl = document.querySelector('[data-health-total]');
  var upEl = document.querySelector('[data-health-up]');
  var degradedEl = document.querySelector('[data-health-degraded]');
  var downEl = document.querySelector('[data-health-down]');
  var chartCanvas = document.querySelector('[data-health-chart]');
  var chartLegend = document.querySelector('[data-health-chart-legend]');
  var chartTooltip = document.querySelector('[data-health-chart-tooltip]');
  var chartWindowInput = document.querySelector('[data-health-chart-window]');
  var historyList = document.querySelector('[data-health-history]');
  var historyCount = document.querySelector('[data-health-history-count]');
  var resetButton = document.querySelector('[data-health-reset]');
  var historyToggle = document.querySelector('[data-health-history-toggle]');
  var simStatus = document.querySelector('[data-sim-status]');
  var simLatency = document.querySelector('[data-sim-latency]');
  var simLatencyValue = document.querySelector('[data-sim-latency-value]');
  var simCode = document.querySelector('[data-sim-code]');
  var simApply = document.querySelector('[data-sim-apply]');
  var simReset = document.querySelector('[data-sim-reset]');
  var simMessage = document.querySelector('[data-sim-message]');
  var simEnabledToggle = document.querySelector('[data-sim-enabled]');
  var simToggleMessage = document.querySelector('[data-sim-toggle-message]');
  var nukeButton = document.querySelector('[data-nuke-all]');
  var simCard = document.querySelector('.health-sim-card');
  var simBody = document.querySelector('[data-sim-body]');
  var apiList = document.querySelector('[data-api-list]');
  var apiManager = document.querySelector('[data-api-manager]');
  var apiManagerDescription = document.querySelector('[data-api-manager-description]');
  var apiNewButton = document.querySelector('[data-api-new]');
  var apiForm = document.querySelector('[data-api-form]');
  var apiId = document.querySelector('[data-api-id]');
  var apiName = document.querySelector('[data-api-name]');
  var apiUrl = document.querySelector('[data-api-url]');
  var apiMin = document.querySelector('[data-api-min]');
  var apiMax = document.querySelector('[data-api-max]');
  var apiLatency = document.querySelector('[data-api-latency]');
  var apiSave = document.querySelector('[data-api-save]');
  var apiClear = document.querySelector('[data-api-clear]');
  var apiMessage = document.querySelector('[data-api-message]');
  var systemsOverviewTitle = document.querySelector('[data-systems-overview-title]');
  var systemsOverviewSubtitle = document.querySelector('[data-systems-overview-subtitle]');
  var showLatestButton = document.querySelector('[data-show-latest-button]');
  var responseModal = document.querySelector('[data-response-modal]');
  var responseModalBody = document.querySelector('[data-response-modal-body]');
  var responseModalCloseBtns = document.querySelectorAll('[data-response-modal-close]');

  var isLoading = false;
  var historyKey = "api-vitals-history";
  var chartWindowKey = "api-vitals-chart-window";
  var hiddenApisKey = "api-vitals-hidden-apis";
  var simEnabledKey = "api-vitals-sim-enabled";
  var chartColors = ["#1b998b", "#e76f51", "#277da1", "#f4a261", "#6c5ce7", "#00b4d8"];
  var showAllHistory = false;
  var historyPreviewCount = 5;
  var chartWindowDefault = 30;
  var chartWindow = null;
  var simEnabled = false;
  var chartPoints = [];
  var hoveredPoint = null;
  var hiddenApis = {};
  var apiManagerMode = "list";
  var selectedHistoryIndex = null;
  var isViewingHistory = false;

  function formatDateTime(value) {
    if (!value) return "--";
    var date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString() + " \u00b7 " + date.toLocaleTimeString();
  }

  function formatLatency(ms) {
    if (ms == null) return "--";
    if (ms < 1000) return ms + " ms";
    return (ms / 1000).toFixed(2) + " s";
  }

  function formatBytes(bytes) {
    if (bytes == null || Number.isNaN(bytes)) return "--";
    if (bytes < 1024) return bytes + " B";
    var kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + " KB";
    var mb = kb / 1024;
    return mb.toFixed(1) + " MB";
  }

  function formatProtocol(protocol) {
    if (!protocol) return "--";
    if (protocol === "HTTP_1_1") return "HTTP/1.1";
    if (protocol === "HTTP_2") return "HTTP/2";
    return protocol;
  }

  function setLoading(isLoading) {
    if (!refreshButton) return;
    refreshButton.disabled = isLoading;
    refreshButton.textContent = isLoading ? "Checking..." : "Run checks";
  }

  function setSimMessage(text) {
    if (!simMessage) return;
    simMessage.textContent = text || "";
  }

  function setSimToggleMessage(text) {
    if (!simToggleMessage) return;
    simToggleMessage.textContent = text || "";
  }

  function setSimCardDisabled(disabled) {
    if (!simBody) return;
    simBody.classList.toggle("health-sim-body--disabled", disabled);
  }

  function setSimControlsEnabled(enabled) {
    if (simStatus) simStatus.disabled = !enabled;
    if (simLatency) simLatency.disabled = !enabled;
    if (simCode) simCode.disabled = !enabled;
    if (simApply) simApply.disabled = !enabled;
    if (simReset) simReset.disabled = !enabled;
  }

  function setApiMessage(text) {
    if (!apiMessage) return;
    apiMessage.textContent = text || "";
  }

  function updateSimLatencyValue() {
    if (!simLatency || !simLatencyValue) return;
    simLatencyValue.textContent = simLatency.value;
  }

  function fillSimForm(config) {
    if (!config) return;
    if (simStatus && config.mode) simStatus.value = config.mode;
    if (simLatency && typeof config.latencyMs === "number") {
      simLatency.value = String(config.latencyMs);
      updateSimLatencyValue();
    }
    if (simCode) {
      simCode.value = config.statusCode != null ? String(config.statusCode) : "";
    }
  }

  function readSimPayload() {
    var latency = simLatency ? Number(simLatency.value) : 0;
    if (Number.isNaN(latency)) latency = 0;
    var statusCode = simCode && simCode.value ? Number(simCode.value) : null;
    if (statusCode != null && Number.isNaN(statusCode)) statusCode = null;
    return {
      mode: simStatus ? simStatus.value : "UP",
      latencyMs: latency,
      statusCode: statusCode
    };
  }

  function setApiManagerMode(mode, options) {
    apiManagerMode = mode;
    var isCreate = mode === "create";
    if (apiManager) {
      apiManager.classList.toggle("health-manager-card--create", isCreate);
    }
    if (apiNewButton) {
      apiNewButton.textContent = isCreate ? "Back to list" : "New API";
    }
    if (apiManagerDescription) {
      apiManagerDescription.textContent = isCreate
        ? "Create a new API with custom health thresholds."
        : "Create, update, or remove APIs that get checked on the dashboard.";
    }
    if (isCreate && options && options.resetForm) {
      clearApiForm();
    }
  }

  function applySimConfig(payload, message) {
    if (!simApply) return;
    simApply.disabled = true;
    setSimMessage("");
    fetch("/api/simulated", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Simulation update failed");
        return response.json();
      })
      .then(function (data) {
        fillSimForm(data);
        setSimMessage(message || "Simulation updated.");
        loadChecks();
      })
      .catch(function () {
        setSimMessage("Failed to update simulation.");
      })
      .finally(function () {
        simApply.disabled = false;
      });
  }

  function loadSimConfig() {
    if (!simStatus) return;
    fetch("/api/simulated")
      .then(function (response) {
        if (!response.ok) throw new Error("Simulation load failed");
        return response.json();
      })
      .then(function (data) {
        fillSimForm(data);
      })
      .catch(function () {
        
      });
  }

  function filterSimulated(checks) {
    if (!Array.isArray(checks)) return [];
    if (simEnabled) return checks.slice();
    return checks.filter(function (check) { return check.id !== "simulated"; });
  }

  function summarizeChecks(checks) {
    var summary = { up: 0, degraded: 0, down: 0 };
    checks.forEach(function (check) {
      var status = normalizeStatus(check);
      if (status === "UP") summary.up += 1;
      if (status === "DEGRADED") summary.degraded += 1;
      if (status === "DOWN" || status === "ERROR") summary.down += 1;
    });
    return summary;
  }

  function loadSimState() {
    var hasConsumer = Boolean(simEnabledToggle || chartCanvas || historyList);
    if (!hasConsumer) return;
    fetch("/api/simulated/state")
      .then(function (response) {
        if (!response.ok) throw new Error("Simulation state load failed");
        return response.json();
      })
      .then(function (data) {
        simEnabled = Boolean(data.enabled);
        writeSimPreference(simEnabled);
        if (simEnabledToggle) {
          simEnabledToggle.checked = simEnabled;
          setSimToggleMessage("");
        }
        setSimControlsEnabled(simEnabled);
        setSimCardDisabled(!simEnabled);
        renderHistory();
        renderChart();
      })
      .catch(function () {
        var stored = readSimPreference();
        if (stored != null) {
          simEnabled = stored;
          if (simEnabledToggle) {
            simEnabledToggle.checked = simEnabled;
            setSimToggleMessage("");
          }
          setSimControlsEnabled(simEnabled);
          setSimCardDisabled(!simEnabled);
          renderHistory();
          renderChart();
        } else {
          setSimToggleMessage("Unable to load simulation state.");
        }
      });
  }

  function updateSimState(enabled) {
    if (!simEnabledToggle) return;
    setSimToggleMessage("");
    fetch("/api/simulated/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: enabled })
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Simulation state update failed");
        return response.json();
      })
      .then(function (data) {
        simEnabled = Boolean(data.enabled);
        writeSimPreference(simEnabled);
        simEnabledToggle.checked = simEnabled;
        setSimControlsEnabled(simEnabled);
        setSimCardDisabled(!simEnabled);
        setSimToggleMessage("");
        renderHistory();
        renderChart();
        loadChecks();
      })
      .catch(function () {
        setSimToggleMessage("Unable to update simulation state.");
        simEnabledToggle.checked = !enabled;
        simEnabled = !enabled;
        setSimControlsEnabled(simEnabled);
        setSimCardDisabled(!simEnabled);
        renderHistory();
        renderChart();
      });
  }

  function renderApiList(definitions) {
    if (!apiList) return;
    apiList.innerHTML = "";
    if (!Array.isArray(definitions) || definitions.length === 0) {
      var empty = document.createElement("div");
      empty.className = "health-list-empty";
      empty.textContent = "No APIs configured. Add your first one below.";
      apiList.appendChild(empty);
      return;
    }

    definitions.forEach(function (definition) {
      var item = document.createElement("div");
      item.className = "health-manager-item";

      var title = document.createElement("div");
      title.className = "health-manager-item-title";
      title.textContent = definition.name || definition.id || "Untitled";

      var url = document.createElement("div");
      url.className = "health-manager-item-url";
      url.textContent = definition.url || "--";

      var meta = document.createElement("div");
      meta.className = "health-manager-item-meta";
      var slaText = definition.latencyWarnMs > 0 ? definition.latencyWarnMs + "ms" : "No SLA";
      meta.textContent =
        "Success " +
        definition.expectedStatusMin +
        "-" +
        definition.expectedStatusMax +
        " / SLA " +
        slaText;

      var actions = document.createElement("div");
      actions.className = "health-manager-item-actions";

      var editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "health-manager-button";
      editButton.textContent = "Edit";
      editButton.title = "Edit this API definition";
      editButton.addEventListener("click", function () {
        fillApiForm(definition);
      });

      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "health-manager-button";
      deleteButton.textContent = "Delete";
      deleteButton.title = "Delete this API definition";
      deleteButton.addEventListener("click", function () {
        deleteDefinition(definition.id);
      });

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);

      item.appendChild(title);
      item.appendChild(url);
      item.appendChild(meta);
      item.appendChild(actions);
      apiList.appendChild(item);
    });
  }

  function fillApiForm(definition) {
    if (!definition) return;
    setApiManagerMode("create", { resetForm: false });
    if (apiId) apiId.value = definition.id || "";
    if (apiName) apiName.value = definition.name || "";
    if (apiUrl) apiUrl.value = definition.url || "";
    if (apiMin) apiMin.value = definition.expectedStatusMin || "";
    if (apiMax) apiMax.value = definition.expectedStatusMax || "";
    if (apiLatency) apiLatency.value = definition.latencyWarnMs || "";
    setApiMessage("Editing " + (definition.name || definition.id || "API") + ".");
  }

  function clearApiForm() {
    if (apiId) apiId.value = "";
    if (apiName) apiName.value = "";
    if (apiUrl) apiUrl.value = "";
    if (apiMin) apiMin.value = "";
    if (apiMax) apiMax.value = "";
    if (apiLatency) apiLatency.value = "";
    setApiMessage("");
  }

  function readApiPayload() {
    var payload = {
      id: apiId && apiId.value ? apiId.value.trim() : null,
      name: apiName ? apiName.value.trim() : "",
      url: apiUrl ? apiUrl.value.trim() : ""
    };
    var minVal = apiMin && apiMin.value ? Number(apiMin.value) : null;
    var maxVal = apiMax && apiMax.value ? Number(apiMax.value) : null;
    var latencyVal = apiLatency && apiLatency.value ? Number(apiLatency.value) : null;
    if (minVal != null && Number.isNaN(minVal)) minVal = null;
    if (maxVal != null && Number.isNaN(maxVal)) maxVal = null;
    if (latencyVal != null && Number.isNaN(latencyVal)) latencyVal = null;
    payload.expectedStatusMin = minVal;
    payload.expectedStatusMax = maxVal;
    payload.latencyWarnMs = latencyVal;
    return payload;
  }

  function loadDefinitions() {
    if (!apiList) return;
    fetch("/api/definitions")
      .then(function (response) {
        if (!response.ok) throw new Error("Definitions load failed");
        return response.json();
      })
      .then(function (data) {
        renderApiList(data);
      })
      .catch(function () {
        setApiMessage("Unable to load API definitions.");
      });
  }

  function saveDefinition(payload) {
    if (!apiSave) return;
    apiSave.disabled = true;
    setApiMessage("");
    var isUpdate = payload.id && payload.id.length > 0;
    var url = isUpdate ? "/api/definitions/" + encodeURIComponent(payload.id) : "/api/definitions";
    var method = isUpdate ? "PUT" : "POST";
    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) return response.text().then(function (text) { throw new Error(text || "Save failed"); });
        return response.json();
      })
      .then(function (data) {
        setApiMessage(isUpdate ? "API updated." : "API added.");
        fillApiForm(data);
        setApiManagerMode("list", { resetForm: false });
        loadDefinitions();
        loadChecks();
      })
      .catch(function (err) {
        setApiMessage(err && err.message ? err.message : "Unable to save API.");
      })
      .finally(function () {
        apiSave.disabled = false;
      });
  }

  function deleteDefinition(id) {
    if (!id) return;
    setApiMessage("");
    fetch("/api/definitions/" + encodeURIComponent(id), { method: "DELETE" })
      .then(function (response) {
        if (!response.ok) return response.text().then(function (text) { throw new Error(text || "Delete failed"); });
      })
      .then(function () {
        if (apiId && apiId.value === id) {
          clearApiForm();
        }
        setApiMessage("API removed.");
        loadDefinitions();
        loadChecks();
      })
      .catch(function (err) {
        setApiMessage(err && err.message ? err.message : "Unable to delete API.");
      });
  }

  function normalizeStatus(item) {
    if (item && item.status) return item.status;
    if (item && item.up === true) return "UP";
    if (item && item.up === false) return "DOWN";
    return "UNKNOWN";
  }

  function statusClass(status) {
    if (status === "UP") return "health-pill--up";
    if (status === "DEGRADED") return "health-pill--degraded";
    if (status === "ERROR") return "health-pill--error";
    if (status === "UNKNOWN") return "health-pill--unknown";
    return "health-pill--down";
  }

  function statusDotClass(status) {
    if (status === "UP") return "health-summary-dot--up";
    if (status === "DEGRADED") return "health-summary-dot--degraded";
    if (status === "DOWN") return "health-summary-dot--down";
    return "";
  }

  function setBanner(status, downCount, degradedCount) {
    if (!banner || !bannerTitle || !bannerSubtitle) return;
    banner.classList.remove("health-banner--up", "health-banner--degraded", "health-banner--down");
    if (status === "DOWN") {
      banner.classList.add("health-banner--down");
      bannerTitle.textContent = "Attention needed";
      bannerSubtitle.textContent = downCount + " critical system(s) are down.";
      return;
    }
    if (status === "DEGRADED") {
      banner.classList.add("health-banner--degraded");
      bannerTitle.textContent = "Performance issues detected";
      bannerSubtitle.textContent = degradedCount + " system(s) are responding slowly.";
      return;
    }
    banner.classList.add("health-banner--up");
    bannerTitle.textContent = "All systems operational";
    bannerSubtitle.textContent = "APIs are responding within expected targets.";
  }

  function renderChecks(items, isHistorical) {
    if (!listBody) return;
    isHistorical = isHistorical || false;

    if (!Array.isArray(items) || items.length === 0) {
      if (!isViewingHistory) {
        listBody.innerHTML = "";
        var empty = document.createElement("div");
        empty.className = "health-list-empty";
        empty.textContent = "No checks configured.";
        listBody.appendChild(empty);
      }
      return;
    }

    var upCount = 0;
    var degradedCount = 0;
    var downCount = 0;
    var latestCheckedAt = null;

    items.forEach(function (item) {
      var status = normalizeStatus(item);
      if (status === "UP") upCount += 1;
      if (status === "DEGRADED") degradedCount += 1;
      if (status === "DOWN" || status === "ERROR") downCount += 1;
      if (item.checkedAt) {
        var checkedAt = new Date(item.checkedAt);
        if (!latestCheckedAt || checkedAt > latestCheckedAt) {
          latestCheckedAt = checkedAt;
        }
      }
    });

    
    if (!isViewingHistory) {
      listBody.innerHTML = "";
      
      items.forEach(function (item) {
        var row = document.createElement("div");
        row.className = "health-row";

        var systemCell = document.createElement("div");
        systemCell.className = "health-cell health-cell--system";
        systemCell.dataset.label = "System";
        var systemName = document.createElement("div");
        systemName.className = "health-system-name";
        systemName.textContent = item.name || item.id || "Untitled";
        var systemUrl = document.createElement("div");
        systemUrl.className = "health-system-url";
        systemUrl.textContent = item.url || "";
        systemCell.appendChild(systemName);
        systemCell.appendChild(systemUrl);
        if (item.finalUrl && item.finalUrl !== item.url) {
          var finalUrl = document.createElement("div");
          finalUrl.className = "health-system-url health-system-url--final";
          finalUrl.textContent = "Final: " + item.finalUrl;
          systemCell.appendChild(finalUrl);
        }

        var statusCell = document.createElement("div");
        statusCell.className = "health-cell";
        statusCell.dataset.label = "Status";
        var pill = document.createElement("span");
        pill.className = "health-pill " + statusClass(normalizeStatus(item));
        pill.textContent = normalizeStatus(item);
        statusCell.appendChild(pill);

        var latencyCell = document.createElement("div");
        latencyCell.className = "health-cell";
        latencyCell.dataset.label = "Latency";
        latencyCell.textContent = formatLatency(item.latencyMs);

        var targetCell = document.createElement("div");
        targetCell.className = "health-cell";
        targetCell.dataset.label = "SLA";
        if (item.latencySlaMs && item.latencySlaMs > 0) {
          targetCell.textContent = "<= " + formatLatency(item.latencySlaMs);
        } else {
          targetCell.textContent = "No SLA";
        }

        var responseCell = document.createElement("div");
        responseCell.className = "health-cell health-cell--stack health-cell--clickable";
        responseCell.dataset.label = "Response";
        responseCell.title = "View response details";
        var responseType = document.createElement("div");
        responseType.className = "health-response-link";
        responseType.textContent = item.contentType || "--";
        var responseMeta = document.createElement("div");
        responseMeta.className = "health-cell-subtext";
        responseMeta.textContent = formatProtocol(item.protocol) + " / " + formatBytes(item.contentLength);
        responseCell.appendChild(responseType);
        responseCell.appendChild(responseMeta);
        responseType.addEventListener("click", function () {
          showResponseModal(item);
        });
        responseType.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            showResponseModal(item);
          }
        });

        var checkedCell = document.createElement("div");
        checkedCell.className = "health-cell";
        checkedCell.dataset.label = "Checked";
        checkedCell.textContent = formatDateTime(item.checkedAt);

        row.appendChild(systemCell);
        row.appendChild(statusCell);
        row.appendChild(latencyCell);
        row.appendChild(targetCell);
        row.appendChild(responseCell);
        row.appendChild(checkedCell);

        if (item.error) {
          var errorNote = document.createElement("div");
          errorNote.className = "health-row-note";
          errorNote.textContent = item.error;
          row.appendChild(errorNote);
        }

        listBody.appendChild(row);
      });

      var overallStatus = "UP";
      if (downCount > 0) {
        overallStatus = "DOWN";
      } else if (degradedCount > 0) {
        overallStatus = "DEGRADED";
      }
      setBanner(overallStatus, downCount, degradedCount);

      if (summary) {
        if (overallStatus === "DOWN") {
          summary.textContent = "Attention needed";
        } else if (overallStatus === "DEGRADED") {
          summary.textContent = "Performance issues";
        } else {
          summary.textContent = "All systems operational";
        }
      }
      if (summaryDot) {
        summaryDot.className = "health-summary-dot " + statusDotClass(overallStatus);
      }
      if (timestamp) {
        var stamp = latestCheckedAt || new Date();
        timestamp.textContent = formatDateTime(stamp);
      }
      if (totalEl) totalEl.textContent = String(items.length);
      if (upEl) upEl.textContent = String(upCount);
      if (degradedEl) degradedEl.textContent = String(degradedCount);
      if (downEl) downEl.textContent = String(downCount);
    }

    var historyEntry = {
      checkedAt: latestCheckedAt ? latestCheckedAt.toISOString() : new Date().toISOString(),
      total: items.length,
      up: upCount,
      degraded: degradedCount,
      down: downCount,
      checks: items.map(function (item) {
        return {
          id: item.id,
          name: item.name || item.id || "Untitled",
          url: item.url,
          finalUrl: item.finalUrl,
          latencyMs: item.latencyMs,
          latencySlaMs: item.latencySlaMs,
          status: normalizeStatus(item),
          statusCode: item.statusCode,
          contentType: item.contentType,
          protocol: item.protocol,
          contentLength: item.contentLength,
          error: item.error,
          responseBody: item.responseBody
        };
      })
    };
    historyEntry.slowest = findSlowest(historyEntry.checks);
    addHistory(historyEntry);
    renderHistory();
    renderChart();
    
    
    if (!isViewingHistory) {
      if (systemsOverviewTitle) {
        systemsOverviewTitle.textContent = "Systems overview (Latest)";
      }
      if (systemsOverviewSubtitle) {
        systemsOverviewSubtitle.textContent = "Viewing snapshot from " + formatDateTime(historyEntry.checkedAt);
      }
    }
  }

  function findSlowest(checks) {
    if (!Array.isArray(checks) || checks.length === 0) return null;
    var slowest = null;
    checks.forEach(function (check) {
      if (check.latencyMs == null) return;
      if (!slowest || check.latencyMs > slowest.latencyMs) {
        slowest = check;
      }
    });
    return slowest;
  }

  function describeHistoryIssues(checks) {
    if (!Array.isArray(checks) || checks.length === 0) return ["All systems healthy."];
    var degraded = [];
    var down = [];
    checks.forEach(function (check) {
      var status = normalizeStatus(check);
      var label = check.name || check.id || "API";
      if (status === "DEGRADED") degraded.push(label);
      if (status === "DOWN" || status === "ERROR") down.push(label);
    });
    if (degraded.length === 0 && down.length === 0) {
      return ["All systems healthy."];
    }
    var parts = [];
    down.forEach(function (api) {
      parts.push("Down: " + api);
    });
    degraded.forEach(function (api) {
      parts.push("Degraded: " + api);
    });
    return parts;
  }

  function readHistory() {
    try {
      var raw = localStorage.getItem(historyKey);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }

  function normalizeChartWindow(value) {
    if (value == null || Number.isNaN(value)) return null;
    var rounded = Math.floor(value);
    return rounded > 0 ? rounded : null;
  }

  function readChartWindowPreference() {
    try {
      var raw = localStorage.getItem(chartWindowKey);
      if (raw == null) return { value: null, hasPreference: false };
      if (raw === "all") return { value: null, hasPreference: true };
      var numeric = Number(raw);
      return { value: normalizeChartWindow(numeric), hasPreference: true };
    } catch (err) {
      return { value: null, hasPreference: false };
    }
  }

  function writeChartWindowPreference(value) {
    try {
      var stored = value == null ? "all" : String(value);
      localStorage.setItem(chartWindowKey, stored);
    } catch (err) {
      
    }
  }

  function updateChartWindowMax(totalRuns) {
    if (!chartWindowInput) return;
    if (typeof totalRuns !== "number" || totalRuns < 1) {
      chartWindowInput.removeAttribute("max");
      return;
    }
    chartWindowInput.max = String(totalRuns);
  }

  function readHiddenApis() {
    try {
      var raw = localStorage.getItem(hiddenApisKey);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (err) {
      return {};
    }
  }

  function writeHiddenApis(value) {
    try {
      localStorage.setItem(hiddenApisKey, JSON.stringify(value));
    } catch (err) {
      
    }
  }

  function readSimPreference() {
    try {
      var raw = localStorage.getItem(simEnabledKey);
      if (raw == null) return null;
      return raw === "true";
    } catch (err) {
      return null;
    }
  }

  function writeSimPreference(value) {
    try {
      localStorage.setItem(simEnabledKey, String(Boolean(value)));
    } catch (err) {
      
    }
  }

  function writeHistory(items) {
    try {
      localStorage.setItem(historyKey, JSON.stringify(items));
    } catch (err) {
      
    }
  }

  function clearLocalData() {
    try {
      localStorage.removeItem(historyKey);
      localStorage.removeItem(chartWindowKey);
      localStorage.removeItem(hiddenApisKey);
      localStorage.removeItem(simEnabledKey);
    } catch (err) {
      
    }
    hiddenApis = {};
    writeHiddenApis(hiddenApis);
    writeHistory([]);
    simEnabled = false;
    writeSimPreference(false);
    showAllHistory = false;
    chartWindow = chartWindowDefault;
    if (chartWindowInput) {
      chartWindowInput.value = String(chartWindow);
    }
  }

  function addHistory(entry) {
    var history = readHistory();
    history.push(entry);
    writeHistory(history);
  }

  function clearHistory() {
    writeHistory([]);
    selectedHistoryIndex = null;
    isViewingHistory = false;
    renderHistory();
    renderChart();
  }

  function showHistoricalSnapshot(index) {
    var history = readHistory();
    if (index < 0 || index >= history.length) return;
    var entry = history[index];
    selectedHistoryIndex = index;
    isViewingHistory = true;
    if (showLatestButton) {
      showLatestButton.style.display = "inline-block";
    }
    renderHistoricalChecks(entry);
    renderHistory();
  }

  function showLatestSnapshot() {
    selectedHistoryIndex = null;
    isViewingHistory = false;
    if (showLatestButton) {
      showLatestButton.style.display = "none";
    }
    renderHistory();
    
    
    var history = readHistory();
    if (history.length > 0) {
      var latestEntry = history[history.length - 1];
      renderHistoricalChecks(latestEntry);
      
      if (systemsOverviewTitle) {
        systemsOverviewTitle.textContent = "Systems overview (Latest)";
      }
      if (systemsOverviewSubtitle) {
        systemsOverviewSubtitle.textContent = "Viewing snapshot from " + formatDateTime(latestEntry.checkedAt);
      }
    } else {
      
      if (systemsOverviewTitle) {
        systemsOverviewTitle.textContent = "Systems overview (Latest)";
      }
      if (systemsOverviewSubtitle) {
        systemsOverviewSubtitle.textContent = "No checks have been run yet.";
      }
      if (listBody) {
        listBody.innerHTML = "";
        var empty = document.createElement("div");
        empty.className = "health-list-empty";
        empty.textContent = "No checks configured.";
        listBody.appendChild(empty);
      }
    }
  }

  function showResponseModal(item) {
    if (!responseModal || !responseModalBody) return;
    
    var details = {
      "System Name": item.name || item.id || "Untitled",
      "URL": item.url || "--",
      "Final URL": item.finalUrl || "--",
      "Status": normalizeStatus(item),
      "Status Code": item.statusCode != null ? item.statusCode : "--",
      "Content Type": item.contentType || "--",
      "Content Length": formatBytes(item.contentLength),
      "Protocol": formatProtocol(item.protocol),
      "Latency": formatLatency(item.latencyMs),
      "Latency SLA": item.latencySlaMs ? formatLatency(item.latencySlaMs) : "No SLA",
      "Checked At": formatDateTime(item.checkedAt),
      "Error": item.error || "None"
    };
    
    responseModalBody.innerHTML = "";
    var table = document.createElement("div");
    table.className = "response-modal-table";
    
    Object.keys(details).forEach(function (key) {
      var row = document.createElement("div");
      row.className = "response-modal-row";
      var label = document.createElement("div");
      label.className = "response-modal-label";
      label.textContent = key;
      var value = document.createElement("div");
      value.className = "response-modal-value";
      value.textContent = details[key];
      row.appendChild(label);
      row.appendChild(value);
      table.appendChild(row);
    });
    
    responseModalBody.appendChild(table);
    
    
    if (item.responseBody) {
      var bodySection = document.createElement("div");
      bodySection.className = "response-body-section";
      var bodyTitle = document.createElement("h3");
      bodyTitle.className = "response-body-title";
      bodyTitle.textContent = "Response Body";
      bodySection.appendChild(bodyTitle);
      
      var bodyContent = document.createElement("pre");
      bodyContent.className = "response-body-content";
      
      
      try {
        var parsed = JSON.parse(item.responseBody);
        bodyContent.textContent = JSON.stringify(parsed, null, 2);
      } catch (e) {
        
        bodyContent.textContent = item.responseBody;
      }
      
      bodySection.appendChild(bodyContent);
      responseModalBody.appendChild(bodySection);
    }
    
    responseModal.classList.add("response-modal--open");
    document.body.style.overflow = "hidden";
  }

  function closeResponseModal() {
    if (!responseModal) return;
    responseModal.classList.remove("response-modal--open");
    document.body.style.overflow = "";
  }

  function renderHistoricalChecks(entry) {
    if (!listBody) return;
    var checks = entry.checks || [];
    var visibleChecks = filterSimulated(checks);
    
    if (systemsOverviewTitle) {
      systemsOverviewTitle.textContent = "Systems overview (Historical)";
    }
    if (systemsOverviewSubtitle) {
      systemsOverviewSubtitle.textContent = "Viewing snapshot from " + formatDateTime(entry.checkedAt);
    }
    
    listBody.innerHTML = "";
    
    if (visibleChecks.length === 0) {
      var empty = document.createElement("div");
      empty.className = "health-list-empty";
      empty.textContent = "No checks in this snapshot.";
      listBody.appendChild(empty);
      return;
    }

    visibleChecks.forEach(function (check) {
      var row = document.createElement("div");
      row.className = "health-row";

      var systemCell = document.createElement("div");
      systemCell.className = "health-cell health-cell--system";
      systemCell.dataset.label = "System";
      var systemName = document.createElement("div");
      systemName.className = "health-system-name";
      systemName.textContent = check.name || check.id || "Untitled";
      var systemUrl = document.createElement("div");
      systemUrl.className = "health-system-url";
      systemUrl.textContent = check.url || "";
      systemCell.appendChild(systemName);
      systemCell.appendChild(systemUrl);
      if (check.finalUrl && check.finalUrl !== check.url) {
        var finalUrl = document.createElement("div");
        finalUrl.className = "health-system-url health-system-url--final";
        finalUrl.textContent = "Final: " + check.finalUrl;
        systemCell.appendChild(finalUrl);
      }

      var statusCell = document.createElement("div");
      statusCell.className = "health-cell";
      statusCell.dataset.label = "Status";
      var pill = document.createElement("span");
      pill.className = "health-pill " + statusClass(check.status);
      pill.textContent = check.status;
      statusCell.appendChild(pill);

      var latencyCell = document.createElement("div");
      latencyCell.className = "health-cell";
      latencyCell.dataset.label = "Latency";
      latencyCell.textContent = formatLatency(check.latencyMs);

      var targetCell = document.createElement("div");
      targetCell.className = "health-cell";
      targetCell.dataset.label = "SLA";
      if (check.latencySlaMs && check.latencySlaMs > 0) {
        targetCell.textContent = "<= " + formatLatency(check.latencySlaMs);
      } else {
        targetCell.textContent = "No SLA";
      }

      var responseCell = document.createElement("div");
      responseCell.className = "health-cell health-cell--stack health-cell--clickable";
      responseCell.dataset.label = "Response";
      responseCell.title = "View response details";
      var responseType = document.createElement("div");
      responseType.className = "health-response-link";
      responseType.textContent = check.contentType || "--";
      var responseMeta = document.createElement("div");
      responseMeta.className = "health-cell-subtext";
      responseMeta.textContent = formatProtocol(check.protocol) + " / " + formatBytes(check.contentLength);
      responseCell.appendChild(responseType);
      responseCell.appendChild(responseMeta);
      var itemData = {
        name: check.name,
        id: check.id,
        url: check.url,
        finalUrl: check.finalUrl,
        status: check.status,
        statusCode: check.statusCode,
        contentType: check.contentType,
        contentLength: check.contentLength,
        protocol: check.protocol,
        latencyMs: check.latencyMs,
        latencySlaMs: check.latencySlaMs,
        checkedAt: entry.checkedAt,
        error: check.error,
        responseBody: check.responseBody
      };
      responseType.addEventListener("click", function () {
        showResponseModal(itemData);
      });
      responseType.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showResponseModal(itemData);
        }
      });

      var checkedCell = document.createElement("div");
      checkedCell.className = "health-cell";
      checkedCell.dataset.label = "Checked";
      checkedCell.textContent = formatDateTime(entry.checkedAt);

      row.appendChild(systemCell);
      row.appendChild(statusCell);
      row.appendChild(latencyCell);
      row.appendChild(targetCell);
      row.appendChild(responseCell);
      row.appendChild(checkedCell);

      if (check.error) {
        var errorNote = document.createElement("div");
        errorNote.className = "health-row-note";
        errorNote.textContent = check.error;
        row.appendChild(errorNote);
      }

      listBody.appendChild(row);
    });

    var overallStatus = "UP";
    if (entry.down > 0) {
      overallStatus = "DOWN";
    } else if (entry.degraded > 0) {
      overallStatus = "DEGRADED";
    }
    setBanner(overallStatus, entry.down, entry.degraded);

    if (summary) {
      if (overallStatus === "DOWN") {
        summary.textContent = "Attention needed";
      } else if (overallStatus === "DEGRADED") {
        summary.textContent = "Performance issues";
      } else {
        summary.textContent = "All systems operational";
      }
    }
    if (summaryDot) {
      summaryDot.className = "health-summary-dot " + statusDotClass(overallStatus);
    }
    if (timestamp) {
      timestamp.textContent = formatDateTime(entry.checkedAt);
    }
    if (totalEl) totalEl.textContent = String(entry.total);
    if (upEl) upEl.textContent = String(entry.up);
    if (degradedEl) degradedEl.textContent = String(entry.degraded);
    if (downEl) downEl.textContent = String(entry.down);
  }

  function renderHistory() {
    if (!historyList) return;
    var history = readHistory().slice().reverse();
    var visibleHistory = showAllHistory ? history : history.slice(0, historyPreviewCount);
    historyList.innerHTML = "";

    if (history.length === 0) {
      var empty = document.createElement("div");
      empty.className = "health-history-empty";
      empty.textContent = "No history yet. Checks will appear here.";
      historyList.appendChild(empty);
      if (historyCount) historyCount.textContent = "Showing 0 of 0";
      if (historyToggle) {
        historyToggle.disabled = true;
        historyToggle.textContent = "Show all history";
      }
      return;
    }

    visibleHistory.forEach(function (entry, displayIndex) {
      var actualIndex = showAllHistory ? (history.length - 1 - displayIndex) : (history.length - 1 - displayIndex);
      var row = document.createElement("div");
      row.className = "health-history-row";

      var time = document.createElement("div");
      time.className = "health-history-time";
      time.textContent = formatHistoryTimestamp(entry.checkedAt);

      var visibleChecks = filterSimulated(entry.checks || []);
      var summaryCounts = simEnabled ? { up: entry.up, degraded: entry.degraded, down: entry.down } : summarizeChecks(visibleChecks);

      var summaryText = document.createElement("div");
      summaryText.className = "health-history-summary";
      var countsLine = document.createElement("div");
      countsLine.className = "health-history-counts";
      if (summaryCounts.down > 0) {
        countsLine.classList.add("health-history-counts--down");
      } else if (summaryCounts.degraded > 0) {
        countsLine.classList.add("health-history-counts--degraded");
      }
      countsLine.textContent = summaryCounts.up + " up, " + summaryCounts.degraded + " degraded, " + summaryCounts.down + " down";
      summaryText.appendChild(countsLine);
      
      var issues = describeHistoryIssues(visibleChecks);
      issues.forEach(function (issueText) {
        var issueLine = document.createElement("div");
        issueLine.className = "health-history-issues";
        issueLine.textContent = issueText;
        summaryText.appendChild(issueLine);
      });

      var viewButton = document.createElement("button");
      viewButton.type = "button";
      viewButton.className = "health-history-button";
      viewButton.textContent = "⌕";
      viewButton.setAttribute("aria-label", "View details");
      viewButton.title = "View snapshot details";
      var isThisSelected = selectedHistoryIndex === actualIndex;
      viewButton.addEventListener("click", function () {
        if (isThisSelected) {
          showLatestSnapshot();
        } else {
          showHistoricalSnapshot(actualIndex);
        }
      });

      row.appendChild(time);
      row.appendChild(summaryText);
      row.appendChild(viewButton);
      historyList.appendChild(row);
    });

    if (historyToggle) {
      historyToggle.disabled = history.length <= historyPreviewCount;
      historyToggle.textContent = showAllHistory ? "Show less" : "Show all history";
    }
    if (historyCount) {
      historyCount.textContent = "Showing " + visibleHistory.length + " of " + history.length;
    }
    historyList.classList.toggle("health-history-list--scroll", showAllHistory && history.length > historyPreviewCount);
  }

  function renderLegend(checks, colorMap) {
    if (!chartLegend) return;
    chartLegend.innerHTML = "";
    if (!Array.isArray(checks) || checks.length === 0) return;

    checks.forEach(function (check, index) {
      var isHidden = Boolean(hiddenApis[check.id]);
      var color = colorMap && colorMap[check.id] ? colorMap[check.id] : chartColors[index % chartColors.length];
      var item = document.createElement("span");
      item.className = "health-legend-item" + (isHidden ? " health-legend-item--hidden" : "");
      var dot = document.createElement("span");
      dot.className = "health-legend-dot";
      dot.style.background = color;
      item.appendChild(dot);
      var label = document.createElement("span");
      label.textContent = check.name || check.id || "API";
      item.appendChild(label);
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "health-legend-toggle";
      toggle.setAttribute("aria-label", (isHidden ? "Show " : "Hide ") + (check.name || check.id || "API"));
      toggle.title = (isHidden ? "Show " : "Hide ") + (check.name || check.id || "API");
      toggle.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        (isHidden
          ? '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" stroke-width="2"/>' +
            '<path d="M4 4l16 16" fill="none" stroke="currentColor" stroke-width="2"/>'
          : '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" stroke-width="2"/>' +
            '<circle cx="12" cy="12" r="3" fill="currentColor"/>') +
        "</svg>";
      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        if (!check.id) return;
        if (hiddenApis[check.id]) {
          delete hiddenApis[check.id];
        } else {
          hiddenApis[check.id] = true;
        }
        writeHiddenApis(hiddenApis);
        renderChart();
      });
      item.appendChild(toggle);
      chartLegend.appendChild(item);
    });
  }

  function formatHistoryTimestamp(value) {
    return formatDateTime(value);
  }

  function renderChart() {
    if (!chartCanvas) return;
    var history = readHistory();
    updateChartWindowMax(history.length);
    if (chartWindow != null && chartWindow > 0) {
      history = history.slice(-chartWindow);
    }
    if (history.length === 0) return;

    var latestChecks = filterSimulated(history[history.length - 1].checks || []);
    var colorMap = {};
    latestChecks.forEach(function (check, index) {
      if (!check.id) return;
      colorMap[check.id] = chartColors[index % chartColors.length];
    });
    renderLegend(latestChecks, colorMap);

    var rect = chartCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var dpr = window.devicePixelRatio || 1;
    chartCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    chartCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
    var ctx = chartCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var width = rect.width;
    var height = rect.height;
    ctx.clearRect(0, 0, width, height);

    var padding = 24;
    var chartWidth = width - padding * 2;
    var chartHeight = height - padding * 2;

    var allLatencies = [];
    var visibleLatestChecks = latestChecks.filter(function (check) {
      return !hiddenApis[check.id];
    });
    history.forEach(function (entry) {
      var visibleChecks = filterSimulated(entry.checks || []).filter(function (check) {
        return !hiddenApis[check.id];
      });
      visibleChecks.forEach(function (check) {
        if (typeof check.latencyMs === "number") {
          allLatencies.push(check.latencyMs);
        }
      });
    });
    var maxLatency = allLatencies.reduce(function (max, value) {
      return Math.max(max, value);
    }, 0);
    var scaleMax = maxLatency > 0 ? maxLatency : 1;

    function drawGrid() {
      ctx.strokeStyle = "rgba(11, 31, 42, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      var gridSteps = 4;
      for (var i = 0; i <= gridSteps; i += 1) {
        var y = padding + (chartHeight * i) / gridSteps;
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(11, 31, 42, 0.45)";
      ctx.font = "12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "left";
      for (var j = 0; j <= gridSteps; j += 1) {
        var value = scaleMax - (scaleMax * j) / gridSteps;
        var rounded = Math.round(Math.max(0, value));
        var label = formatLatency(rounded);
        var textY = padding + (chartHeight * j) / gridSteps;
        ctx.fillText(label, padding, textY - 6);
      }
    }

    function plotLatencyLine(values, color) {
      var hasValue = values.some(function (value) { return value != null; });
      if (!hasValue) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      var hasStarted = false;
      values.forEach(function (value, index) {
        if (value == null) return;
        var x = padding + (chartWidth * index) / Math.max(values.length - 1, 1);
        var y = height - padding - (chartHeight * value) / scaleMax;
        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.fillStyle = color;
      values.forEach(function (value, index) {
        if (value == null) return;
        var x = padding + (chartWidth * index) / Math.max(values.length - 1, 1);
        var y = height - padding - (chartHeight * value) / scaleMax;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        chartPoints.push({
          x: x,
          y: y,
          latencyMs: value,
          time: history[index] ? history[index].checkedAt : null,
          color: color
        });
      });
    }

    chartPoints = [];
    drawGrid();
    visibleLatestChecks.forEach(function (check) {
      var values = history.map(function (entry) {
        var filtered = filterSimulated(entry.checks || []).filter(function (item) {
          return !hiddenApis[item.id];
        });
        var match = filtered.find(function (item) {
          return item.id === check.id;
        });
        return match ? match.latencyMs : null;
      });
      plotLatencyLine(values, colorMap[check.id] || chartColors[0]);
    });
  }

  function formatTimestamp(value) {
    if (!value) return "--";
    var date = new Date(value);
    return formatDateTime(date);
  }

  function updateChartTooltip(point) {
    if (!chartTooltip || !chartCanvas) return;
    if (!point) {
      chartTooltip.style.opacity = "0";
      return;
    }
    var card = chartCanvas.parentElement;
    if (!card) return;
    var canvasRect = chartCanvas.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var left = point.x + (canvasRect.left - cardRect.left);
    var top = point.y + (canvasRect.top - cardRect.top);
    chartTooltip.style.opacity = "1";
    chartTooltip.style.left = left + "px";
    chartTooltip.style.top = top + "px";
    chartTooltip.textContent = formatTimestamp(point.time) + " · " + formatLatency(point.latencyMs);
  }

  function findClosestPoint(x, y) {
    var closest = null;
    var closestDistance = Infinity;
    chartPoints.forEach(function (point) {
      var dx = x - point.x;
      var dy = y - point.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDistance) {
        closest = point;
        closestDistance = dist;
      }
    });
    if (closestDistance <= 10) {
      return closest;
    }
    return null;
  }

  function loadChecks() {
    if (isLoading) return;
    isLoading = true;
    setLoading(true);
    fetch("/api/checks")
      .then(function (response) {
        if (!response.ok) throw new Error("Health API error");
        return response.json();
      })
      .then(function (data) {
        renderChecks(data);
      })
      .catch(function () {
        renderChecks([]);
      })
      .finally(function () {
        setLoading(false);
        isLoading = false;
      });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadChecks);
  }
  if (resetButton) {
    resetButton.addEventListener("click", clearHistory);
  }
  if (showLatestButton) {
    showLatestButton.addEventListener("click", showLatestSnapshot);
  }
  if (responseModalCloseBtns && responseModalCloseBtns.length > 0) {
    responseModalCloseBtns.forEach(function (btn) {
      btn.addEventListener("click", closeResponseModal);
    });
  }
  if (historyToggle) {
    historyToggle.addEventListener("click", function () {
      showAllHistory = !showAllHistory;
      renderHistory();
    });
  }
  if (chartWindowInput) {
    chartWindowInput.addEventListener("input", function () {
      var raw = chartWindowInput.value.trim();
      var numeric = raw ? Number(raw) : null;
      var totalRuns = readHistory().length;
      var normalized = normalizeChartWindow(numeric);
      if (normalized != null && totalRuns > 0) {
        normalized = Math.min(normalized, totalRuns);
      }
      chartWindow = normalized;
      if (chartWindowInput && chartWindow != null) {
        chartWindowInput.value = String(chartWindow);
      }
      writeChartWindowPreference(chartWindow);
      renderChart();
    });
  }
  if (simLatency) {
    updateSimLatencyValue();
    simLatency.addEventListener("input", updateSimLatencyValue);
  }
  if (simApply) {
    simApply.addEventListener("click", function () {
      applySimConfig(readSimPayload());
    });
  }
  if (simReset) {
    simReset.addEventListener("click", function () {
      applySimConfig({ mode: "UP", latencyMs: 240, statusCode: 200 }, "Simulation reset.");
    });
  }
  if (simEnabledToggle) {
    simEnabledToggle.addEventListener("change", function () {
      updateSimState(simEnabledToggle.checked);
    });
  }
  if (chartCanvas) {
    chartCanvas.addEventListener("mousemove", function (event) {
      var rect = chartCanvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      hoveredPoint = findClosestPoint(x, y);
      updateChartTooltip(hoveredPoint);
    });
    chartCanvas.addEventListener("mouseleave", function () {
      hoveredPoint = null;
      updateChartTooltip(null);
    });
  }
  if (apiForm) {
    apiForm.addEventListener("submit", function (event) {
      event.preventDefault();
      saveDefinition(readApiPayload());
    });
  }
  if (apiClear) {
    apiClear.addEventListener("click", function () {
      clearApiForm();
    });
  }
  if (apiNewButton) {
    apiNewButton.addEventListener("click", function () {
      var toCreate = apiManagerMode !== "create";
      setApiManagerMode(toCreate ? "create" : "list", { resetForm: toCreate });
    });
  }
  if (nukeButton) {
    nukeButton.addEventListener("click", function () {
      var confirmed = window.confirm("Nuke all data and reset the app to a fresh start?");
      if (!confirmed) return;
      nukeButton.disabled = true;
      nukeButton.textContent = "Resetting...";
      fetch("/api/reset", { method: "POST" })
        .then(function (response) {
          if (!response.ok) throw new Error("Reset failed");
        })
        .then(function () {
          clearLocalData();
          if (simEnabledToggle) {
            simEnabledToggle.checked = false;
            setSimToggleMessage("");
          }
          setSimControlsEnabled(false);
          setSimCardDisabled(true);
          clearApiForm();
          setApiMessage("");
          renderHistory();
          renderChart();
          loadSimConfig();
          loadSimState();
          loadDefinitions();
          loadChecks();
        })
        .catch(function () {
          window.alert("Unable to reset app data.");
        })
        .finally(function () {
          nukeButton.disabled = false;
          nukeButton.textContent = "Nuke all";
        });
    });
  }

  hiddenApis = readHiddenApis();
  setApiManagerMode("list", { resetForm: false });
  var storedChartWindow = readChartWindowPreference();
  if (storedChartWindow.hasPreference) {
    chartWindow = storedChartWindow.value;
  } else {
    chartWindow = chartWindowDefault;
  }
  if (chartWindowInput) {
    chartWindowInput.value = chartWindow == null ? "" : String(chartWindow);
  }
  updateChartWindowMax(readHistory().length);
  var storedSimEnabled = readSimPreference();
  if (storedSimEnabled != null) {
    simEnabled = storedSimEnabled;
    if (simEnabledToggle) {
      simEnabledToggle.checked = simEnabled;
      setSimToggleMessage("");
    }
    setSimControlsEnabled(simEnabled);
    setSimCardDisabled(!simEnabled);
  } else {
    simEnabled = false;
    if (simEnabledToggle) {
      simEnabledToggle.checked = false;
      setSimToggleMessage("");
    }
    setSimControlsEnabled(false);
    setSimCardDisabled(true);
  }

  loadSimConfig();
  loadSimState();
  loadDefinitions();
  renderHistory();
  renderChart();
  
  
  var initialHistory = readHistory();
  if (initialHistory.length > 0) {
    showLatestSnapshot();
  } else {
    loadChecks();
  }
  
  setInterval(loadChecks, 60000);
})();
