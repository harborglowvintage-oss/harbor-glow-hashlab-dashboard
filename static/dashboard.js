// --- DeLorean Current Date/Time with Seconds ---
function updateDeLoreanCurrentTime() {
    const dateEl = document.getElementById('delorean-current-date');
    const timeEl = document.getElementById('delorean-current-time');
    if (!dateEl || !timeEl) return;
    const now = new Date();
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[now.getMonth()];
    const day = String(now.getDate()).padStart(2,'0');
    const year = now.getFullYear();
    dateEl.textContent = `${month} ${day} ${year}`;
    const hour = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    const sec = String(now.getSeconds()).padStart(2,'0');
    timeEl.textContent = `${hour}:${min}:${sec}`;
}

setInterval(updateDeLoreanCurrentTime, 1000);
document.addEventListener('DOMContentLoaded', updateDeLoreanCurrentTime);

const HASHRATE_SPIN_THRESHOLD_BY_TYPE = {
    BG02: 11,
    NERDQ: 15
};
const HASHRATE_SPIN_THRESHOLD_BY_NAME = {
    NERDAXE1: 15,
    NERDAXE: 15,
    NERD: 15
};

function minerTriggersOrbSpin(name, miner) {
    if (!miner) return false;
    const normalizedName = (name || '').toString().trim().toUpperCase();
    const normalizedType = (miner.type || '').toString().trim().toUpperCase();
    const typeThreshold = HASHRATE_SPIN_THRESHOLD_BY_TYPE[normalizedType];
    const nameThreshold = HASHRATE_SPIN_THRESHOLD_BY_NAME[normalizedName];
    const threshold = typeof nameThreshold === 'number' ? nameThreshold : typeThreshold;
    if (!threshold) return false;
    const hashrate = Number(miner.hashrate_1m) || 0;
    return hashrate > threshold;
}

async function updateMiners() {
    const minersRoot = document.getElementById("miners");
    try {
        const res = await fetch("/miner-data", { credentials: "include" });
        if (!res.ok) {
            throw new Error(`Miner data request failed with status ${res.status}`);
        }
        const data = await res.json();

        const entries = Object.entries(data || {});
        const activeEntries = entries.filter(([, miner]) => miner && miner.alive);
        const orbSpinNeeded = activeEntries.some(([name, miner]) => minerTriggersOrbSpin(name, miner));
        if (typeof window.setTealOrbSpin === 'function') {
            window.setTealOrbSpin(orbSpinNeeded);
        }
        let allCards = [];
        
        // Find highest hashrate
        let highestHashrate = 0;
        let highestHashrateName = null;
        activeEntries.forEach(([name, m]) => {
            if (m.hashrate_1m > highestHashrate) {
                highestHashrate = m.hashrate_1m;
                highestHashrateName = name;
            }
        });
        
        // Find lowest efficiency (best) - overall
        let lowestEfficiency = Infinity;
        let lowestEfficiencyName = null;
        activeEntries.forEach(([name, m]) => {
            if (m.efficiency < lowestEfficiency) {
                lowestEfficiency = m.efficiency;
                lowestEfficiencyName = name;
            }
        });
        
        // Find lowest efficiency (best) - BG02 only
        let lowestEfficiencyBG02 = Infinity;
        let lowestEfficiencyBG02Name = null;
        activeEntries.forEach(([name, m]) => {
            if (m.type === 'BG02' && m.efficiency < lowestEfficiencyBG02) {
                lowestEfficiencyBG02 = m.efficiency;
                lowestEfficiencyBG02Name = name;
            }
        });

        // Escape HTML to prevent XSS
        function escapeHTML(str) {
            return String(str).replace(/[&<>"']/g, function (c) {
                return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
            });
        }
        for (const [name, m] of activeEntries) {
            const isHighestHash = name === highestHashrateName;
            const isLowestEff = name === lowestEfficiencyName;
            const isLowestEffBG02 = name === lowestEfficiencyBG02Name && name !== lowestEfficiencyName;

            const tempF = (typeof m.temp === 'number') ? (m.temp * 9/5 + 32).toFixed(1) : 'N/A';
            const chipTempVal = (typeof m.chipTemp === 'number' && !isNaN(m.chipTemp))
                ? m.chipTemp
                : (typeof m.temp === 'number' && !isNaN(m.temp) ? m.temp : null);
            const chipTempF = (chipTempVal !== null) ? (chipTempVal * 9/5 + 32).toFixed(1) : 'N/A';

            const rawStatus = (m.status || '').toString();
            const statusText = rawStatus ? escapeHTML(rawStatus) : 'Status Unknown';
            const normalizedStatus = rawStatus.toLowerCase();
            let statusClass = 'status-ok';
            if (normalizedStatus.includes('heat')) {
                statusClass = 'status-hot';
            } else if (normalizedStatus.includes('reject')) {
                statusClass = 'status-reject';
            } else if (normalizedStatus.includes('offline')) {
                statusClass = 'status-offline';
            }

            // Only show multiple ASIC temps for miners that actually expose per-ASIC data
            let asicList = "";
            if (m.type !== 'NERDQ' && m.asicTemps && m.asicTemps.length > 0) {
                asicList = `
                    <div><b>ASIC Temps:</b></div>
                    ${m.asicTemps.map((t, i) => {
                        const tF = (t * 9/5 + 32).toFixed(1);
                        return `Chip ${escapeHTML(i + 1)}: ${escapeHTML(t)}°C / ${escapeHTML(tF)}°F`;
                    }).join("<br>")}
                `;
            }

            const cardHtml = `
                <div class="miner-card">
                    ${isHighestHash ? '<div class="badge-hashrate">B⭐</div>' : ''}
                    ${isLowestEff ? '<div class="badge-efficiency">⚡</div>' : ''}
                    <div class="gauge-efficiency-row">
                        <div class="hashrate-display-box">
                            <div class="hashrate-value">${escapeHTML((m.hashrate_avg || m.hashrate_1m).toFixed(3))}</div>
                            <div class="hashrate-unit">TH/s</div>
                        </div>

                        <canvas class="gauge" data-name="${escapeHTML(name)}" aria-hidden="true"></canvas>

                        <div class="efficiency-panel">
                            <div class="efficiency-value">${escapeHTML(m.efficiency.toFixed(2))}</div>
                            <div class="efficiency-unit">J/TH</div>
                        </div>
                    </div>

                    <h2>${escapeHTML(name)} (${escapeHTML(m.type)})</h2>
                    <div class="miner-status ${statusClass}">${statusText}</div>

                    <div class="miner-data">
                        <div>Temp: ${typeof m.temp === 'number' ? escapeHTML(m.temp) + '°C / ' + escapeHTML(tempF) + '°F' : 'N/A'}</div>
                        <div>ASIC Temp: ${chipTempVal !== null ? escapeHTML(chipTempVal) + '°C / ' + escapeHTML(chipTempF) + '°F' : 'N/A'}</div>
                        ${m.fanSpeed ? `<div>Fan Speed: ${escapeHTML(m.fanSpeed)} RPM</div>` : ''}
                        ${m.voltage ? `<div>Voltage: ${escapeHTML(m.voltage)} V</div>` : ''}
                        ${m.asicFreq || m.frequency ? `<div>ASIC Freq: ${escapeHTML(m.asicFreq || m.frequency)} MHz</div>` : ''}
                        <div>Accepted: ${escapeHTML(m.sharesAccepted)}</div>
                        <div>Rejected: ${escapeHTML(m.sharesRejected)}</div>
                        <div>ASIC Count: ${escapeHTML(m.asicCount)}</div>
                        ${asicList}
                        <div>Power: ${escapeHTML(m.power)} W</div>
                        <div>Uptime: ${escapeHTML(m.uptime)}</div>
                    </div>
                </div>
            `;

            allCards.push(cardHtml);
        }

        const totalSlots = 9;
        const openSlots = Math.max(0, totalSlots - allCards.length);
        const placeholderCount = openSlots > 0 ? Math.min(3, Math.max(1, openSlots)) : 0;
        for (let i = 0; i < placeholderCount; i++) {
            allCards.push(`
                <div class="placeholder-card">
                    <div>OPEN MINER SLOT</div>
                    <div>Deploy next rig</div>
                </div>
            `);
        }

        const activeMiners = activeEntries.map(([, m]) => m);

        if (window.updateSwarmgateLinks) {
            const swarmgateList = activeEntries.map(([name, m]) => ({
                name,
                ip: m.ip || '',
                type: m.type || ''
            }));
            window.updateSwarmgateLinks(swarmgateList);
        }

        const avgEff = activeMiners.length > 0
            ? activeMiners.reduce((sum, m) => sum + (m.efficiency || 0), 0) / activeMiners.length
            : 0;

        const effPercent = activeMiners.length > 0
            ? Math.max(0, Math.min(100, (100 - Math.min(avgEff, 100))))
            : 0;

        const totalAccepted = activeMiners.reduce((sum, m) => sum + (m.sharesAccepted || 0), 0);
        const totalRejected = activeMiners.reduce((sum, m) => sum + (m.sharesRejected || 0), 0);
        const totalStale = activeMiners.reduce((sum, m) => sum + ((m.sharesStale ?? m.staleShares ?? 0)), 0);
        const totalActiveMiners = activeMiners.length;
        
        const totalHashrate = activeMiners.reduce((sum, m) => sum + (m.hashrate_1m || 0), 0);

        const totalSegments = 32;
        const stepSize = 0.25;
        const filledSegments = Math.round((effPercent / 100) * totalSegments / stepSize) * stepSize;

        let segmentHtml = "";
        for (let i = 1; i <= totalSegments; i++) {
            const isActive = i <= filledSegments;
            const cls = isActive
                ? `efficiency-bar segment-${Math.min(i,16)}`
                : `efficiency-bar inactive`;
            segmentHtml += `<div class="${cls}"></div>`;
        }

        let html = `
            <div class="efficiency-section">
                <div class="section-title">SYSTEM EFFICIENCY</div>

                <div class="efficiency-bar-container">
                    ${segmentHtml}
                </div>

                <div class="efficiency-display">
                    <input type="range"
                           class="efficiency-slider"
                           min="0"
                           max="10000"
                           value="${Math.round(effPercent * 100)}">

                    <div class="efficiency-label">${avgEff.toFixed(2)} J/TH</div>
                    <div class="efficiency-percent">${effPercent.toFixed(3)}%</div>
                </div>
                
                <div class="total-stats">
                    <div class="total-stat-item">
                        <div class="total-stat-value">${avgEff.toFixed(2)}</div>
                        <div class="total-stat-label">J/TH</div>
                    </div>
                    <div class="total-stat-item">
                        <div class="total-stat-value">${totalHashrate.toFixed(2)}</div>
                        <div class="total-stat-label">TH/s</div>
                    </div>
                </div>
            </div>

            <div class="shares-section">
                <div class="shares-panel">
                    <div class="shares-panel-columns">
                        <div class="shares-col">
                            <div class="shares-value">${totalAccepted.toLocaleString()}</div>
                            <div class="shares-label">SHARES</div>
                        </div>
                        <div class="shares-col">
                            <div class="shares-value">${totalRejected.toLocaleString()}</div>
                            <div class="shares-label">REJECTED</div>
                        </div>
                        <div class="shares-col">
                            <div class="shares-value">${totalStale.toLocaleString()}</div>
                            <div class="shares-label">STALE</div>
                        </div>
                        <div class="shares-col">
                            <div class="shares-value">${totalActiveMiners}</div>
                            <div class="shares-label">MINERS</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid-wrapper">
                <div class="section-title">MINERS</div>
                <div class="section-grid">
                    ${allCards.join("")}
                </div>
            </div>
        `;

        if (minersRoot) {
            minersRoot.innerHTML = html;
        }

        // Calculate total wattage
        const totalWatts = activeMiners.reduce((sum, m) => sum + (m.power || 0), 0);

        // Update PSU fan display
        if (typeof window.updatePSUWattage === 'function') {
            window.updatePSUWattage(totalWatts);
        }

        // Update DeLorean power cost display (5-row)
        updateDeLoreanPowerDisplay5Row(totalWatts);

        window.latestMinerData = data;

        if (window.updateGauges) window.updateGauges();

    } catch (err) {
        console.error("Failed to refresh miner data:", err);
        if (minersRoot) {
            minersRoot.innerHTML = `
                <div class="miner-error">
                    <p>Unable to reach /miner-data. Check that the FastAPI server is running and that LAN access rules allow this client.</p>
                    <p class="caption">${err?.message || "Network error"}</p>
                </div>
            `;
        }
    }
}

updateMiners();
setInterval(updateMiners, 5000);


// --- 5-Row DeLorean Power Cost Display Logic ---

function updateDeLoreanPowerDisplay5Row(totalWatts) {
    const costInput = document.getElementById('costPerKwh');
    if (!costInput) return;
    const costPerKwh = parseFloat(costInput.value) || 0.13;
    // Calculations
    const kwhHourly = totalWatts / 1000;
    const kwhDaily = kwhHourly * 24;
    const kwhMonthly = kwhDaily * 30.4375;
    const kwhAnnual = kwhDaily * 365;
    const costHourly = kwhHourly * costPerKwh;
    const costDaily = kwhDaily * costPerKwh;
    const costMonthly = kwhMonthly * costPerKwh;
    const costAnnual = kwhAnnual * costPerKwh;
    // For total, just sum annual (or could sum all, but annual is the max period)
    const totalKwh = kwhAnnual;
    const totalCost = costAnnual;

    // Hourly row: show kWh and cost
    setDeloreanBlock('hourly-min', kwhHourly.toFixed(3) + ' kWh');
    setDeloreanBlock('hourly-cost', `$${costHourly.toFixed(4)}`);

    // Daily row: show kWh and cost
    setDeloreanBlock('daily-day', kwhDaily.toFixed(2) + ' kWh');
    setDeloreanBlock('daily-cost', `$${costDaily.toFixed(3)}`);

    // Monthly row: show kWh and cost
    setDeloreanBlock('monthly-month', kwhMonthly.toFixed(1) + ' kWh');
    setDeloreanBlock('monthly-cost', `$${costMonthly.toFixed(2)}`);

    // Annual row: show kWh and cost
    setDeloreanBlock('annual-year', kwhAnnual.toFixed(2) + ' kWh');
    setDeloreanBlock('annual-cost', `$${costAnnual.toFixed(2)}`);

    // Total row: show total kWh and cost
    setDeloreanBlock('total-kwh', totalKwh.toFixed(2) + ' kWh');
    setDeloreanBlock('total-cost', `$${totalCost.toFixed(2)}`);
}

function setDeloreanBlock(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== val) {
        el.classList.remove('nixie-animate');
        // Force reflow for restart animation
        void el.offsetWidth;
        el.textContent = val;
        el.classList.add('nixie-animate');
    }
}

// Listen for cost input changes
document.addEventListener('DOMContentLoaded', function() {
    const costInput = document.getElementById('costPerKwh');
    if (costInput) {
        costInput.addEventListener('input', function() {
            let totalWatts = 0;
            if (window.latestMinerData) {
                Object.values(window.latestMinerData).forEach(m => {
                    if (m && m.alive) {
                        totalWatts += m.power || 0;
                    }
                });
            }
            updateDeLoreanPowerDisplay5Row(totalWatts);
        });
    }
});

// Handle add/delete miner via approval slider
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addMinerForm');
    const slider = document.getElementById('approvalSlider');
    const sliderLabel = document.getElementById('sliderLabel');
    const statusDiv = document.getElementById('addMinerStatus');
    if (!form || !slider || !sliderLabel || !statusDiv) return;

    form.addEventListener('submit', e => e.preventDefault());

    async function executeMinerAction() {
        const actionInput = form.querySelector('input[name="minerAction"]:checked');
        const action = actionInput ? actionInput.value : 'add';
        const name = document.getElementById('minerName').value.trim();
        const ip = document.getElementById('minerIP').value.trim();

        if (!name) {
            statusDiv.textContent = 'Miner name is required.';
            statusDiv.className = 'error';
            return false;
        }
        if (action === 'add' && !ip) {
            statusDiv.textContent = 'IP address required for new miner.';
            statusDiv.className = 'error';
            return false;
        }

        const endpoint = action === 'add' ? '/add-miner' : '/delete-miner';
        const payload = action === 'add' ? { name, ip } : { name };
        sliderLabel.textContent = action === 'add' ? 'Adding miner...' : 'Deleting miner...';
        statusDiv.textContent = '';
        statusDiv.className = '';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                statusDiv.textContent = result.message;
                statusDiv.className = 'success';
                if (action === 'add') {
                    form.reset();
                } else {
                    document.getElementById('minerIP').value = '';
                }
                setTimeout(() => {
                    updateMiners();
                    window.location.reload();
                }, 1500);
                return true;
            } else {
                statusDiv.textContent = result.error || 'Action failed';
                statusDiv.className = 'error';
                return false;
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'error';
            return false;
        }
    }

    slider.addEventListener('input', async function() {
        if (Number(slider.value) < 100 || slider.dataset.busy === '1') return;
        slider.dataset.busy = '1';
        slider.disabled = true;
        const success = await executeMinerAction();
        slider.value = 0;
        slider.disabled = false;
        slider.dataset.busy = '0';
        sliderLabel.textContent = 'Slide to Execute';
        if (!success) {
            slider.classList.add('slider-error');
            setTimeout(() => slider.classList.remove('slider-error'), 600);
        }
    });
});
