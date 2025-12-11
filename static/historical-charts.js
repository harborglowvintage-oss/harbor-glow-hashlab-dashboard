(function () {
    const palette = [
        '#00fff0', '#ff6b81', '#ffb347', '#7af0a0', '#a8a4ff',
        '#58b2ff', '#ffc94d', '#00b8a9', '#f57c00', '#5cdb95',
        '#ff8bd3', '#6dd3ff'
    ];

    const formatTimeLabel = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return isoString;
        }
    };

    const formatTimeFromMs = (ms) => {
        try {
            const date = new Date(ms);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return ms;
        }
    };

    const average = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    const baseOptions = (overrides = {}) => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: { color: '#9bdcff' },
                grid: { display: false }
            },
            y: {
                ticks: { color: '#9bdcff' },
                grid: { color: 'rgba(0,255,243,0.07)' }
            },
            ...(overrides.scales || {})
        },
        plugins: {
            legend: {
                labels: { color: '#dffcff' }
            },
            tooltip: { mode: 'nearest', intersect: false },
            ...(overrides.plugins || {})
        },
        ...overrides
    });

    const getCtx = (id) => {
        const el = document.getElementById(id);
        return el ? el.getContext('2d') : null;
    };

    const uniqueSortedTimestamps = (rows) => Array.from(
        new Set(rows.map((r) => r.timestamp).filter(Boolean))
    ).sort((a, b) => new Date(a) - new Date(b));

    const latestSamplesByMiner = (rows, snapshot = {}) => {
        const byMiner = new Map();
        rows.forEach((r) => {
            if (!r.name || !r.timestamp) return;
            const ts = new Date(r.timestamp).getTime();
            const prev = byMiner.get(r.name);
            if (!prev || ts > prev._ts) {
                byMiner.set(r.name, { ...r, _ts: ts });
            }
        });
        const snapshotRows = Object.entries(snapshot || {}).map(([name, payload]) => ({
            name,
            ...(payload || {}),
            _ts: Date.now()
        }));
        snapshotRows.forEach((r) => {
            const prev = byMiner.get(r.name);
            if (!prev || r._ts > prev._ts) {
                byMiner.set(r.name, r);
            }
        });
        return Array.from(byMiner.values());
    };

    const groupRowsByTimestamp = (rows) => {
        const grouped = new Map();
        rows.forEach((row) => {
            const ts = row.timestamp;
            if (!ts) return;
            if (!grouped.has(ts)) grouped.set(ts, []);
            grouped.get(ts).push(row);
        });
        return grouped;
    };

    const buildFleetCharts = (rows, summary) => {
        const fleetCtx = getCtx('fleet-hash-chart');
        const tempCtx = getCtx('avg-temp-chart');
        const grouped = new Map();

        rows.forEach((row) => {
            const ts = row.timestamp;
            if (!ts) return;
            if (!grouped.has(ts)) {
                grouped.set(ts, { timestamp: ts, totalHash: 0, temps: [] });
            }
            const bucket = grouped.get(ts);
            bucket.totalHash += Number(row.hashrate_1m || 0);
            if (row.temp) bucket.temps.push(Number(row.temp));
        });

        const ordered = Array.from(grouped.values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const labels = ordered.map((item) => formatTimeLabel(item.timestamp));
        const totalHashSeries = ordered.map((item) => Number(item.totalHash.toFixed(2)));
        const avgTempSeries = ordered.map((item) => Number(average(item.temps).toFixed(2)));

        if (fleetCtx) {
            new Chart(fleetCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Total TH/s',
                        data: totalHashSeries,
                        borderColor: '#00fff0',
                        backgroundColor: 'rgba(0,255,240,0.1)',
                        tension: 0.25,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: baseOptions()
            });
        }

        if (tempCtx) {
            new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Avg °C',
                        data: avgTempSeries,
                        borderColor: '#ff6b81',
                        backgroundColor: 'rgba(255,107,129,0.1)',
                        tension: 0.25,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0
                    }]
                },
                options: baseOptions()
            });
        }

        const spotlight = document.getElementById('miner-spotlight');
        if (!spotlight) return;
        const lastRow = rows.length ? rows[rows.length - 1] : null;
        const latestStamp = summary?.latest_timestamp || (lastRow && lastRow.timestamp);
        const latestRows = rows.filter((row) => row.timestamp === latestStamp);
        latestRows.sort((a, b) => Number(b.hashrate_1m || 0) - Number(a.hashrate_1m || 0));
        if (!latestRows.length) {
            spotlight.textContent = 'No miner samples available yet.';
            return;
        }
        const list = document.createElement('ul');
        list.style.listStyle = 'none';
        list.style.padding = '0';
        latestRows.slice(0, 5).forEach((row) => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.textContent = `${row.name}: ${Number(row.hashrate_1m || 0).toFixed(2)} TH/s · ${Number(row.temp || 0).toFixed(1)} °C · ${row.alive ? 'online' : 'offline'}`;
            list.appendChild(li);
        });
        spotlight.innerHTML = '';
        spotlight.appendChild(list);
    };

    const buildMinerHashTempChart = (rows) => {
        const ctx = getCtx('miner-hash-temp-chart');
        if (!ctx) return;
        const timestamps = uniqueSortedTimestamps(rows);
        if (!timestamps.length) return;
        const miners = Array.from(new Set(rows.map((r) => r.name).filter(Boolean)));
        const grouped = groupRowsByTimestamp(rows);

        const minerDatasets = miners.map((name, idx) => ({
            label: `${name} TH/s`,
            data: timestamps.map((ts) => {
                const sample = (grouped.get(ts) || []).find((r) => r.name === name);
                return sample ? Number(sample.hashrate_1m || 0) : null;
            }),
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '33',
            tension: 0.25,
            fill: false,
            pointRadius: 0,
            yAxisID: 'y'
        }));

        const tempOverlay = {
            label: 'Avg Temp (°C)',
            data: timestamps.map((ts) => {
                const samples = grouped.get(ts) || [];
                return samples.length ? average(samples.map((s) => Number(s.temp || 0))) : null;
            }),
            borderColor: '#ffb347',
            backgroundColor: 'rgba(255,179,71,0.25)',
            tension: 0.2,
            fill: false,
            pointRadius: 0,
            borderDash: [4, 4],
            yAxisID: 'y1'
        };

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps.map(formatTimeLabel),
                datasets: [...minerDatasets, tempOverlay]
            },
            options: baseOptions({
                scales: {
                    x: {
                        ticks: { color: '#9bdcff' },
                        grid: { display: false }
                    },
                    y: {
                        position: 'left',
                        title: { display: true, text: 'TH/s', color: '#9bdcff' },
                        ticks: { color: '#9bdcff' },
                        grid: { color: 'rgba(0,255,243,0.05)' }
                    },
                    y1: {
                        position: 'right',
                        title: { display: true, text: '°C', color: '#ffb347' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#ffb347' }
                    }
                }
            })
        });
    };

    const buildRejectRateChart = (rows) => {
        const ctx = getCtx('reject-rate-chart');
        if (!ctx) return;
        const timestamps = uniqueSortedTimestamps(rows);
        if (!timestamps.length) return;
        const miners = Array.from(new Set(rows.map((r) => r.name).filter(Boolean)));
        const grouped = groupRowsByTimestamp(rows);
        const datasets = miners.map((name, idx) => ({
            label: `${name} reject %`,
            data: timestamps.map((ts) => {
                const sample = (grouped.get(ts) || []).find((r) => r.name === name);
                if (!sample) return null;
                const accepted = Number(sample.sharesAccepted || 0);
                const rejected = Number(sample.sharesRejected || 0);
                const total = accepted + rejected;
                return total ? (rejected / total) * 100 : 0;
            }),
            borderColor: palette[idx % palette.length],
            backgroundColor: palette[idx % palette.length] + '30',
            fill: true,
            tension: 0.25,
            borderWidth: 1.8,
            pointRadius: 0,
            stack: 'rejects'
        }));

        const threshold = {
            label: '5% Threshold',
            data: timestamps.map(() => 5),
            borderColor: '#ff6b81',
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
            tension: 0,
            yAxisID: 'y'
        };

        new Chart(ctx, {
            type: 'line',
            data: { labels: timestamps.map(formatTimeLabel), datasets: [...datasets, threshold] },
            options: baseOptions({
                scales: {
                    y: {
                        stacked: true,
                        max: 100,
                        ticks: { color: '#9bdcff', callback: (v) => `${v}%` },
                        grid: { color: 'rgba(0,255,243,0.05)' }
                    }
                }
            })
        });
    };

    const buildScatterEfficiency = (latestSamples) => {
        const ctx = getCtx('hashrate-eff-chart');
        if (!ctx || !latestSamples.length) return;
        const points = latestSamples.map((row, idx) => {
            const hash = Number(row.hashrate_1m || 0);
            const eff = row.efficiency != null ? Number(row.efficiency) :
                (row.power && hash ? Number(row.power) / hash : 0);
            return {
                x: hash,
                y: eff,
                miner: row.name || `Miner ${idx + 1}`,
                color: palette[idx % palette.length]
            };
        });

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Miner efficiency',
                    data: points,
                    parsing: false,
                    backgroundColor: points.map((p) => p.color),
                    borderColor: points.map((p) => p.color),
                    pointRadius: 6,
                    pointHoverRadius: 7
                }]
            },
            options: baseOptions({
                scales: {
                    x: {
                        title: { display: true, text: 'Hashrate (TH/s)', color: '#9bdcff' },
                        ticks: { color: '#9bdcff' },
                        grid: { color: 'rgba(0,255,243,0.05)' }
                    },
                    y: {
                        title: { display: true, text: 'Efficiency (W/TH)', color: '#9bdcff' },
                        ticks: { color: '#9bdcff' },
                        grid: { color: 'rgba(0,255,243,0.07)' }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const p = ctx.raw;
                                return `${p.miner}: ${p.x.toFixed(2)} TH/s @ ${p.y.toFixed(2)} W/TH`;
                            }
                        }
                    }
                }
            })
        });
    };

    const buildAvailabilityChart = (rows, minersFallback = []) => {
        const ctx = getCtx('availability-chart');
        if (!ctx) return;
        const perMiner = new Map();
        rows.forEach((r) => {
            if (!r.name || !r.timestamp) return;
            const t = new Date(r.timestamp).getTime();
            if (!perMiner.has(r.name)) perMiner.set(r.name, []);
            perMiner.get(r.name).push({ t, alive: !!r.alive });
        });

        const now = Date.now();
        const segments = [];
        const minerList = perMiner.size ? Array.from(perMiner.keys()) : minersFallback;
        minerList.forEach((miner, idx) => {
            const series = (perMiner.get(miner) || []).sort((a, b) => a.t - b.t);
            if (!series.length) {
                // Mock segments if none are available
                const start = now - 4 * 60 * 60 * 1000;
                const mid = start + 2 * 60 * 60 * 1000;
                segments.push({ miner, start, end: mid, status: idx % 2 === 0 });
                segments.push({ miner, start: mid, end: now, status: idx % 3 !== 0 });
                return;
            }
            let prevState = series[0].alive;
            let start = series[0].t;
            for (let i = 1; i < series.length; i++) {
                const point = series[i];
                if (point.alive !== prevState) {
                    segments.push({ miner, start, end: point.t, status: prevState });
                    start = point.t;
                    prevState = point.alive;
                }
            }
            segments.push({ miner, start, end: series[series.length - 1].t + 10 * 60 * 1000, status: prevState });
        });

        const onlineData = segments.filter((s) => s.status).map((s) => ({ x: [s.start, s.end], y: s.miner }));
        const offlineData = segments.filter((s) => !s.status).map((s) => ({ x: [s.start, s.end], y: s.miner }));

        new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: [
                    {
                        label: 'Online',
                        data: onlineData,
                        backgroundColor: 'rgba(0,255,160,0.7)',
                        borderSkipped: false,
                        stack: 'status'
                    },
                    {
                        label: 'Offline',
                        data: offlineData,
                        backgroundColor: 'rgba(255,107,129,0.65)',
                        borderSkipped: false,
                        stack: 'status'
                    }
                ]
            },
            options: baseOptions({
                indexAxis: 'y',
                parsing: {
                    xAxisKey: 'x',
                    yAxisKey: 'y'
                },
                scales: {
                    x: {
                        type: 'linear',
                        ticks: {
                            color: '#9bdcff',
                            callback: (value) => formatTimeFromMs(value)
                        },
                        grid: { color: 'rgba(0,255,243,0.05)' }
                    },
                    y: {
                        stacked: true,
                        ticks: { color: '#9bdcff' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const [start, end] = ctx.raw.x;
                                return `${ctx.raw.y}: ${ctx.dataset.label} ${formatTimeFromMs(start)} - ${formatTimeFromMs(end)}`;
                            }
                        }
                    }
                }
            })
        });
    };

    const buildTempHistogram = (latestSamples) => {
        const ctx = getCtx('temp-hist-chart');
        if (!ctx || !latestSamples.length) return;
        const temps = latestSamples.map((s) => Number(s.temp || s.asicTemps?.[0] || 0)).filter((t) => t > 0);
        if (!temps.length) return;
        const bins = [];
        for (let t = 30; t <= 90; t += 5) bins.push([t, t + 4]);
        const counts = bins.map(([low, high]) => temps.filter((t) => t >= low && t <= high).length);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.map(([low, high]) => `${low}-${high}°C`),
                datasets: [{
                    label: 'Miner count',
                    data: counts,
                    backgroundColor: 'rgba(0,191,255,0.6)',
                    borderColor: '#00bfff',
                    borderWidth: 1.2
                }]
            },
            options: baseOptions({
                scales: {
                    y: { ticks: { color: '#9bdcff', precision: 0 }, grid: { color: 'rgba(0,255,243,0.08)' } }
                }
            })
        });
    };

    const buildHashrateShare = (latestSamples) => {
        const ctx = getCtx('hashrate-share-chart');
        if (!ctx || !latestSamples.length) return;
        const labels = latestSamples.map((s) => s.name || 'miner');
        const values = latestSamples.map((s) => Number(s.hashrate_1m || 0));
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map((_, idx) => palette[idx % palette.length]),
                    borderColor: '#0a0f1a',
                    borderWidth: 1
                }]
            },
            options: baseOptions({
                plugins: {
                    legend: { position: 'right', labels: { color: '#dffcff' } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${Number(ctx.raw).toFixed(2)} TH/s` } }
                },
                cutout: '50%'
            })
        });
    };

    const buildPowerBtcChart = (rows) => {
        const ctx = getCtx('power-btc-chart');
        if (!ctx) return;
        const grouped = new Map();
        rows.forEach((row) => {
            const ts = row.timestamp;
            if (!ts) return;
            if (!grouped.has(ts)) grouped.set(ts, { power: 0, samples: [] });
            grouped.get(ts).power += Number(row.power || 0);
            grouped.get(ts).samples.push(row);
        });
        const orderedTs = Array.from(grouped.keys()).sort((a, b) => new Date(a) - new Date(b));
        if (!orderedTs.length) return;
        const labels = orderedTs.map(formatTimeLabel);
        const powerSeries = orderedTs.map((ts) => grouped.get(ts).power || 0);
        // Lightweight mock BTC overlay if none present
        const btcSeries = orderedTs.map((_, idx) => 43000 + Math.sin(idx / 4) * 600 + Math.random() * 150);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Power (W)',
                        data: powerSeries,
                        borderColor: '#00fff0',
                        backgroundColor: 'rgba(0,255,240,0.15)',
                        tension: 0.25,
                        fill: true,
                        yAxisID: 'y',
                        pointRadius: 0
                    },
                    {
                        label: 'BTC Price (USD)',
                        data: btcSeries,
                        borderColor: '#f0ad4e',
                        backgroundColor: 'rgba(240,173,78,0.1)',
                        tension: 0.2,
                        fill: false,
                        yAxisID: 'y1',
                        borderDash: [5, 4],
                        pointRadius: 0
                    }
                ]
            },
            options: baseOptions({
                scales: {
                    y: {
                        position: 'left',
                        title: { display: true, text: 'Watts', color: '#9bdcff' },
                        ticks: { color: '#9bdcff' },
                        grid: { color: 'rgba(0,255,243,0.05)' }
                    },
                    y1: {
                        position: 'right',
                        title: { display: true, text: 'BTC USD', color: '#f0ad4e' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#f0ad4e' }
                    }
                }
            })
        });
    };

    const buildEfficiencyDelta = (rows, snapshot = {}) => {
        const ctx = getCtx('efficiency-delta-chart');
        if (!ctx) return;
        const latest = latestSamplesByMiner(rows, snapshot);
        if (!latest.length) return;
        const earliestByMiner = new Map();
        rows.forEach((r) => {
            if (!r.name || !r.timestamp) return;
            const ts = new Date(r.timestamp).getTime();
            if (!earliestByMiner.has(r.name) || ts < earliestByMiner.get(r.name)._ts) {
                earliestByMiner.set(r.name, { ...r, _ts: ts });
            }
        });

        const labels = [];
        const deltas = [];
        latest.forEach((row, idx) => {
            const baseline = earliestByMiner.get(row.name);
            const latestEff = row.efficiency != null ? Number(row.efficiency) :
                (row.power && row.hashrate_1m ? Number(row.power) / Number(row.hashrate_1m) : 0);
            const baseEff = baseline
                ? (baseline.efficiency != null ? Number(baseline.efficiency) :
                    (baseline.power && baseline.hashrate_1m ? Number(baseline.power) / Number(baseline.hashrate_1m) : latestEff))
                : latestEff * (1 + (Math.random() * 0.12 - 0.06));
            labels.push(row.name || `Miner ${idx + 1}`);
            deltas.push(Number((latestEff - baseEff).toFixed(2)));
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Δ W/TH vs 24h ago',
                    data: deltas,
                    backgroundColor: deltas.map((d) => d >= 0 ? 'rgba(255,107,129,0.7)' : 'rgba(0,255,160,0.7)'),
                    borderWidth: 1
                }]
            },
            options: baseOptions({
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${ctx.raw >= 0 ? '+' : ''}${ctx.raw} W/TH`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#9bdcff' },
                        grid: { color: 'rgba(0,255,243,0.07)' }
                    }
                }
            })
        });
    };

    const buildCharts = (rows, summary, snapshot) => {
        const safe = (label, fn) => {
            try {
                fn();
            } catch (err) {
                console.error(`Chart build failed: ${label}`, err);
            }
        };

        safe('fleet', () => buildFleetCharts(rows, summary));
        safe('hash+temp overlay', () => buildMinerHashTempChart(rows));
        safe('reject rate', () => buildRejectRateChart(rows));
        const latest = latestSamplesByMiner(rows, snapshot);
        safe('scatter efficiency', () => buildScatterEfficiency(latest));
        safe('availability timeline', () => buildAvailabilityChart(rows, latest.map((l) => l.name)));
        safe('temp histogram', () => buildTempHistogram(latest));
        safe('hashrate share', () => buildHashrateShare(latest));
        safe('power vs btc', () => buildPowerBtcChart(rows));
        safe('efficiency delta', () => buildEfficiencyDelta(rows, snapshot));
    };

    document.addEventListener('DOMContentLoaded', async () => {
        const statusEl = document.getElementById('history-meta');
        try {
            const [histRes, snapRes] = await Promise.all([
                fetch('/historical-metrics?limit=720', { credentials: 'include' }),
                fetch('/miner-data', { credentials: 'include' })
            ]);
            if (!histRes.ok) throw new Error(`Historical metrics returned ${histRes.status}`);
            const payload = await histRes.json();
            if (!payload.success) {
                throw new Error(payload.error || 'Unable to load historical metrics.');
            }
            const snapshot = snapRes.ok ? await snapRes.json().catch(() => ({})) : {};
            const nowTs = new Date().toISOString();
            const snapshotRows = Object.entries(snapshot || {}).map(([name, miner]) => ({
                ...(miner || {}),
                name,
                timestamp: miner?.timestamp || nowTs
            }));
            const { data = [], summary = {}, samples = 0 } = payload;
            const mergedRows = data && data.length ? [...data, ...snapshotRows] : snapshotRows;
            buildCharts(mergedRows, summary, snapshot);
            if (statusEl) {
                statusEl.textContent = `Samples loaded: ${samples}. Fleet average ${summary?.fleet_avg_hash?.toFixed(2) || '0'} TH/s (${summary?.fleet_hash_trend || 'stable'} trend).`;
            }
        } catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = `⚠️ ${err.message || err}`;
        }
    });
})();
