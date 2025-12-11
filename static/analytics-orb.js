(function () {
    function startOrb() {
        const canvas = document.getElementById('analytics-orb-canvas');
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const center = size / 2;
        const baseRadius = center - 6;

        const sparks = Array.from({ length: 14 }, () => ({
            angle: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.02,
            radius: baseRadius + 4 + Math.random() * 6,
            size: 1 + Math.random() * 1.5,
            hue: 265 + Math.random() * 30
        }));

        function drawBase() {
            const gradient = ctx.createRadialGradient(
                center - 6, center - 6, baseRadius * 0.15,
                center, center, baseRadius
            );
            gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.4, 'rgba(187,146,255,0.65)');
            gradient.addColorStop(1, 'rgba(58,10,94,0.95)');
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(center, center, baseRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawRings(time) {
            const ringCount = 3;
            for (let i = 0; i < ringCount; i++) {
                const radius = baseRadius - i * 6 - 6;
                const alpha = 0.3 + 0.2 * Math.sin(time * 0.002 + i);
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([6, 4]);
                ctx.strokeStyle = `rgba(208,170,255,${alpha})`;
                ctx.lineWidth = 1 + 0.3 * Math.sin(time * 0.003 + i);
                ctx.arc(center, center, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        function drawSparks() {
            sparks.forEach((spark) => {
                spark.angle += spark.speed;
                const x = center + Math.cos(spark.angle) * spark.radius;
                const y = center + Math.sin(spark.angle) * spark.radius;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, spark.size * 4);
                gradient.addColorStop(0, `hsla(${spark.hue},100%,75%,0.9)`);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, spark.size * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x, y, spark.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function drawCorePulse(time) {
            const pulseRadius = 6 + 2 * Math.sin(time * 0.005);
            const gradient = ctx.createRadialGradient(
                center, center, 0,
                center, center, pulseRadius * 3
            );
            gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
            gradient.addColorStop(1, 'rgba(229,200,255,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(center, center, pulseRadius * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        function animate() {
            const time = performance.now();
            ctx.clearRect(0, 0, size, size);
            drawBase();
            drawRings(time);
            drawSparks();
            drawCorePulse(time);
            requestAnimationFrame(animate);
        }
        animate();
    }

    async function hydrateMeta() {
        const hashEl = document.getElementById('analytics-orb-hash');
        const trendEl = document.getElementById('analytics-orb-trend');
        const samplesEl = document.getElementById('analytics-orb-samples');
        if (!hashEl || !trendEl || !samplesEl) {
            return;
        }
        try {
            const response = await fetch('/historical-metrics?limit=120', { credentials: 'same-origin' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payload = await response.json();
            const summary = payload.summary || {};
            const fleetHash = summary.fleet_avg_hash || 0;
            hashEl.textContent = `Fleet Hash: ${fleetHash.toFixed(1)} TH/s`;
            trendEl.textContent = `Trend: ${(summary.fleet_hash_trend || 'n/a')}`;
            samplesEl.textContent = `Samples: ${payload.samples ?? '--'}`;
        } catch (error) {
            console.warn('analytics-orb meta update failed', error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        startOrb();
        hydrateMeta();
        setInterval(hydrateMeta, 60000);
    });
})();
