(function () {
    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return isoString;
        }
    };

    const average = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const buildCharts = (rows, summary) => {
        const fleetCtx = document.getElementById('fleet-hash-chart')?.getContext('2d');
        const tempCtx = document.getElementById('avg-temp-chart')?.getContext('2d');
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
        const labels = ordered.map((item) => formatTime(item.timestamp));
        const totalHashSeries = ordered.map((item) => Number(item.totalHash.toFixed(2)));
        const avgTempSeries = ordered.map((item) => Number(average(item.temps).toFixed(2)));

        const chartOptions = {
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
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#dffcff' }
                }
            }
        };

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
                options: chartOptions
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
                options: chartOptions
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

    document.addEventListener('DOMContentLoaded', async () => {
        const statusEl = document.getElementById('history-meta');
        try {
            const res = await fetch('/historical-metrics?limit=720', { credentials: 'include' });
            if (!res.ok) {
                throw new Error(`Historical metrics returned ${res.status}`);
            }
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                throw new Error(payload.error || 'Unable to load historical metrics.');
            }
            const { data, summary, samples } = payload;
            buildCharts(data, summary);
            statusEl.textContent = `Samples loaded: ${samples}. Fleet average ${summary?.fleet_avg_hash?.toFixed(2) || '0'} TH/s (${summary?.fleet_hash_trend || 'stable'} trend).`;
        } catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = `⚠️ ${err.message || err}`;
        }
    });
})();
