async function updateMiners() {
    try {
        const res = await fetch("/miner-data");
        const data = await res.json();

        let html = "";

        for (const name in data) {
            const m = data[name];

            html += `
                <div class="miner-card">
                    <h2>${name} (${m.type})</h2>
                    <div>Hashrate: ${m.hashrate_1m.toFixed(3)} TH/s</div>
                    <div>24h: ${m.hashrate_24h.toFixed(3)} TH/s</div>
                    <div>Eff: ${m.efficiency.toFixed(2)} J/TH</div>
                    <div>Temp: ${m.temp} °C</div>
                    <div>Chip: ${m.chipTemp} °C</div>
                    <div>Power: ${m.power} W</div>
                </div>
            `;
        }

        document.getElementById("miners").innerHTML = html;

    } catch (err) {
        console.log("Error updating miners", err);
    }
}

updateMiners();
setInterval(updateMiners, 2000);
