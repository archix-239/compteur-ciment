/**
 * Dashboard JS - Compteur Ciment
 * Gere les mises a jour en temps reel, les graphiques et les interactions UI.
 */

// ===================== STATE =====================

const state = {
    running: false,
    pollInterval: null,
    chartInterval: null,
    doughnutChart: null,
    barChart: null,
    previousStats: { conforme: 0, rejete: 0, total: 0 },
};

// ===================== DOM REFS =====================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    sessionId: $("#sessionId"),
    pageTitle: $("#pageTitle"),
    statusBadge: $("#statusBadge"),
    statusText: $(".status-text"),
    btnStartStop: $("#btnStartStop"),
    btnStartStopText: $("#btnStartStopText"),
    iconPlay: $("#iconPlay"),
    iconStop: $("#iconStop"),
    btnReset: $("#btnReset"),
    btnExport: $("#btnExport"),
    statTotal: $("#statTotal"),
    statConforme: $("#statConforme"),
    statRejete: $("#statRejete"),
    statTaux: $("#statTaux"),
    videoFeed: $("#videoFeed"),
    videoPlaceholder: $("#videoPlaceholder"),
    videoBadge: $("#videoBadge"),
    eventsTableBody: $("#eventsTableBody"),
    eventCount: $("#eventCount"),
    sessionsTableBody: $("#sessionsTableBody"),
    toastContainer: $("#toastContainer"),
    // Settings
    cfgVideoSource: $("#cfgVideoSource"),
    cfgConfidence: $("#cfgConfidence"),
    cfgConfidenceValue: $("#cfgConfidenceValue"),
    cfgLinePosition: $("#cfgLinePosition"),
    cfgLineValue: $("#cfgLineValue"),
    btnSaveConfig: $("#btnSaveConfig"),
};

// ===================== INIT =====================

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initCharts();
    initEventListeners();
    loadConfig();
    pollStats();
    state.pollInterval = setInterval(pollStats, 1500);
    state.chartInterval = setInterval(updateCharts, 5000);
});

// ===================== NAVIGATION =====================

function initNavigation() {
    $$(".nav-item").forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const section = item.dataset.section;

            $$(".nav-item").forEach((n) => n.classList.remove("active"));
            item.classList.add("active");

            $$(".section").forEach((s) => s.classList.remove("active"));

            const titles = {
                dashboard: "Tableau de bord",
                history: "Historique",
                settings: "Configuration",
            };

            els.pageTitle.textContent = titles[section] || section;

            const target = document.getElementById(
                "section" + section.charAt(0).toUpperCase() + section.slice(1)
            );
            if (target) target.classList.add("active");

            if (section === "history") loadSessions();
        });
    });

    // Sidebar toggle
    $("#sidebarToggle").addEventListener("click", () => {
        const sidebar = $("#sidebar");
        sidebar.classList.toggle("collapsed");
        sidebar.classList.toggle("visible");
    });
}

// ===================== EVENTS =====================

function initEventListeners() {
    els.btnStartStop.addEventListener("click", toggleCounter);
    els.btnReset.addEventListener("click", resetCounter);
    els.btnExport.addEventListener("click", () => {
        window.location.href = "/api/export";
    });

    // Settings range sliders
    els.cfgConfidence.addEventListener("input", (e) => {
        els.cfgConfidenceValue.textContent = e.target.value;
    });
    els.cfgLinePosition.addEventListener("input", (e) => {
        els.cfgLineValue.textContent = e.target.value + "%";
    });
    els.btnSaveConfig.addEventListener("click", saveConfig);
}

// ===================== API CALLS =====================

async function api(url, options = {}) {
    try {
        const resp = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        return await resp.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// ===================== POLLING =====================

async function pollStats() {
    const data = await api("/api/stats");
    if (!data) return;

    updateUI(data);
    loadEvents();
}

function updateUI(data) {
    // Session ID
    els.sessionId.textContent = data.session_id || "---";

    // Running state
    const wasRunning = state.running;
    state.running = data.running;

    if (data.running) {
        els.statusBadge.classList.add("active");
        els.statusText.textContent = "En cours";
        els.btnStartStopText.textContent = "Arreter";
        els.iconPlay.style.display = "none";
        els.iconStop.style.display = "block";

        if (!wasRunning) {
            els.videoFeed.src = "/stream/video";
            els.videoFeed.classList.add("visible");
            els.videoPlaceholder.classList.add("hidden");
            els.videoBadge.textContent = "En direct";
            els.videoBadge.classList.add("online");
        }
    } else {
        els.statusBadge.classList.remove("active");
        els.statusText.textContent = "Inactif";
        els.btnStartStopText.textContent = "Demarrer";
        els.iconPlay.style.display = "block";
        els.iconStop.style.display = "none";

        if (wasRunning) {
            els.videoFeed.src = "";
            els.videoFeed.classList.remove("visible");
            els.videoPlaceholder.classList.remove("hidden");
            els.videoBadge.textContent = "Hors ligne";
            els.videoBadge.classList.remove("online");
        }
    }

    // Stats with animation
    animateValue(els.statTotal, state.previousStats.total, data.total);
    animateValue(els.statConforme, state.previousStats.conforme, data.conforme);
    animateValue(els.statRejete, state.previousStats.rejete, data.rejete);

    const tauxText = data.taux + "%";
    if (els.statTaux.textContent !== tauxText) {
        els.statTaux.textContent = tauxText;
        flashElement(els.statTaux);
    }

    state.previousStats = {
        total: data.total,
        conforme: data.conforme,
        rejete: data.rejete,
    };

    // Update doughnut chart data
    if (state.doughnutChart) {
        state.doughnutChart.data.datasets[0].data = [
            data.conforme,
            data.rejete,
        ];
        state.doughnutChart.update("none");
    }
}

function animateValue(el, from, to) {
    if (from === to) return;
    el.textContent = to;
    flashElement(el);
}

function flashElement(el) {
    el.classList.remove("updated");
    void el.offsetWidth; // force reflow
    el.classList.add("updated");
}

// ===================== EVENTS TABLE =====================

async function loadEvents() {
    const data = await api("/api/events?limit=30");
    if (!data) return;

    els.eventCount.textContent = `${data.total} evenements`;

    if (data.events.length === 0) {
        els.eventsTableBody.innerHTML =
            '<tr class="empty-row"><td colspan="4">Aucun evenement enregistre</td></tr>';
        return;
    }

    els.eventsTableBody.innerHTML = data.events
        .map(
            (e) => `
        <tr>
            <td style="font-family: monospace; color: var(--text-muted)">#${e.id}</td>
            <td>${formatTime(e.timestamp)}</td>
            <td><span class="badge badge-${e.status === "conforme" ? "conforme" : "rejete"}">${e.status}</span></td>
            <td style="font-family: monospace; font-size: 12px">${truncateId(e.identifier)}</td>
        </tr>
    `
        )
        .join("");
}

// ===================== SESSIONS TABLE =====================

async function loadSessions() {
    const sessions = await api("/api/sessions");
    if (!sessions || sessions.length === 0) {
        els.sessionsTableBody.innerHTML =
            '<tr class="empty-row"><td colspan="7">Aucune session precedente</td></tr>';
        return;
    }

    els.sessionsTableBody.innerHTML = sessions
        .map((s) => {
            const total = s.total_conforme + s.total_rejete;
            const taux =
                total > 0
                    ? Math.round((s.total_conforme / total) * 100)
                    : 0;
            return `
            <tr>
                <td style="font-family: monospace; color: var(--accent)">${s.id}</td>
                <td>${formatTime(s.started_at)}</td>
                <td>${s.ended_at ? formatTime(s.ended_at) : '<span style="color: var(--success)">En cours</span>'}</td>
                <td style="color: var(--success)">${s.total_conforme}</td>
                <td style="color: var(--danger)">${s.total_rejete}</td>
                <td>${total}</td>
                <td><span class="badge">${taux}%</span></td>
            </tr>
        `;
        })
        .join("");
}

// ===================== CHARTS =====================

function initCharts() {
    // Chart.js defaults
    if (typeof Chart === "undefined") return;

    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "rgba(71, 85, 105, 0.3)";
    Chart.defaults.font.family =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Doughnut chart
    const ctxD = document.getElementById("chartDoughnut");
    if (ctxD) {
        state.doughnutChart = new Chart(ctxD, {
            type: "doughnut",
            data: {
                labels: ["Conformes", "Rejetes"],
                datasets: [
                    {
                        data: [0, 0],
                        backgroundColor: ["#10b981", "#ef4444"],
                        borderWidth: 0,
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 16, usePointStyle: true },
                    },
                },
            },
        });
    }

    // Bar chart
    const ctxB = document.getElementById("chartBar");
    if (ctxB) {
        state.barChart = new Chart(ctxB, {
            type: "bar",
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Conformes",
                        data: [],
                        backgroundColor: "rgba(16, 185, 129, 0.7)",
                        borderRadius: 4,
                    },
                    {
                        label: "Rejetes",
                        data: [],
                        backgroundColor: "rgba(239, 68, 68, 0.7)",
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                    },
                },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 12, usePointStyle: true },
                    },
                },
            },
        });
    }
}

async function updateCharts() {
    if (!state.barChart) return;
    const data = await api("/api/chart-data");
    if (!data || data.length === 0) return;

    state.barChart.data.labels = data.map((d) => d.hour);
    state.barChart.data.datasets[0].data = data.map((d) => d.conforme);
    state.barChart.data.datasets[1].data = data.map((d) => d.rejete);
    state.barChart.update();
}

// ===================== ACTIONS =====================

async function toggleCounter() {
    if (state.running) {
        const result = await api("/api/counter/stop", { method: "POST" });
        if (result) toast("Comptage arrete", "info");
    } else {
        const result = await api("/api/counter/start", { method: "POST" });
        if (result && result.error) {
            toast("Erreur: " + result.error, "error");
        } else if (result) {
            toast("Comptage demarre", "success");
        }
    }
    setTimeout(pollStats, 300);
}

async function resetCounter() {
    if (
        !confirm(
            "Reinitialiser le compteur ? Une nouvelle session sera creee."
        )
    )
        return;
    const result = await api("/api/counter/reset", { method: "POST" });
    if (result) {
        toast("Compteur reinitialise - Session " + result.session_id, "info");
        setTimeout(() => {
            pollStats();
            updateCharts();
        }, 300);
    }
}

// ===================== CONFIG =====================

async function loadConfig() {
    const cfg = await api("/api/config");
    if (!cfg) return;

    els.cfgVideoSource.value = cfg.video_source;
    els.cfgConfidence.value = cfg.confidence_threshold;
    els.cfgConfidenceValue.textContent = cfg.confidence_threshold;
    els.cfgLinePosition.value = cfg.line_position;
    els.cfgLineValue.textContent = cfg.line_position + "%";
}

async function saveConfig() {
    const payload = {
        video_source: els.cfgVideoSource.value,
        confidence_threshold: parseFloat(els.cfgConfidence.value),
        line_position: parseInt(els.cfgLinePosition.value),
    };

    const result = await api("/api/config", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (result) {
        toast("Configuration sauvegardee", "success");
    } else {
        toast("Erreur lors de la sauvegarde", "error");
    }
}

// ===================== UTILS =====================

function formatTime(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function truncateId(id) {
    if (!id) return "-";
    if (id.length > 20) return id.substring(0, 8) + "..." + id.slice(-6);
    return id;
}

function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    els.toastContainer.appendChild(el);

    setTimeout(() => {
        el.classList.add("removing");
        setTimeout(() => el.remove(), 300);
    }, 3000);
}
