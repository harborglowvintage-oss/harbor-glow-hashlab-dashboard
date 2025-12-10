let chartRef = null;

async function getMinerData() {
    const r = await fetch("/miner-data");
    return await r.json();
}

async function getChartData() {
    const r = await fetch("/chart-data");
    return await r.json();
}

async function updateGrid() {
    const d = await getMinerData();
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    Object.keys(d).forEach(name => {
        const m = d[name];
        const c = document.createElement("div");
        c.className = "card";
        c.innerHTML = `
            <h2>${name} <span class="${m.online ? "online" : "offline"}">●</span></h2>
            Hashrate: ${m.hash.toFixed(3)} TH/s<br>
            Eff: ${m.eff.toFixed(3)} J/TH<br>
            Temp: ${m.temp} °C<br>
            Chip: ${m.chip} °C
        `;
        grid.appendChild(c);
    });
}

async function updateChart() {
    const d = await getChartData();
    const labels = Object.keys(d);
    const hash = labels.map(k => d[k].hash);
    const eff = labels.map(k => d[k].eff);
    const ctx = document.getElementById("chart").getContext("2d");

    if (chartRef) chartRef.destroy();

    chartRef = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Hashrate (TH/s)",
                    data: hash,
                    backgroundColor: "rgba(0,150,255,0.6)"
                },
                {
                    label: "Efficiency (J/TH)",
                    data: eff,
                    backgroundColor: "rgba(0,255,150,0.6)"
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

async function loop() {
    await updateGrid();
    await updateChart();
}

setInterval(loop, 2000);
loop();
