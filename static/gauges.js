function updateGauges() {
    const gauges = document.querySelectorAll('canvas.gauge');
    gauges.forEach(canvas => {
        const name = canvas.getAttribute('data-name');
        if (!window.latestMinerData || !window.latestMinerData[name]) return;

        const miner = window.latestMinerData[name];
        const hashrate = miner.hashrate_1m || 0;
        const maxHashrate = 10; // 10 TH/s max
        const percent = Math.min((hashrate / maxHashrate) * 100, 100);

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const centerX = w / 2;
        const centerY = h - 10;
        const radius = Math.min(w, h * 2) / 2 - 30;

        const startAngle = Math.PI;
        const endAngle = 2 * Math.PI;
        const valueAngle = startAngle + (endAngle - startAngle) * (percent / 100);

        // Background arc
        ctx.strokeStyle = 'rgba(40, 40, 40, 0.8)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();

        // Draw tick marks every 0.5 TH/s
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= maxHashrate * 2; i++) {
            const tickAngle = startAngle + (endAngle - startAngle) * (i / (maxHashrate * 2));
            const tickLength = (i % 2 === 0) ? 12 : 8; // Longer tick every 1 TH/s
            const x1 = centerX + Math.cos(tickAngle) * (radius - 6);
            const y1 = centerY + Math.sin(tickAngle) * (radius - 6);
            const x2 = centerX + Math.cos(tickAngle) * (radius - 6 - tickLength);
            const y2 = centerY + Math.sin(tickAngle) * (radius - 6 - tickLength);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Draw labels every 1 TH/s
        ctx.fillStyle = '#4ecbff';
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= maxHashrate; i++) {
            const labelAngle = startAngle + (endAngle - startAngle) * (i / maxHashrate);
            const labelRadius = radius - 25;
            const x = centerX + Math.cos(labelAngle) * labelRadius;
            const y = centerY + Math.sin(labelAngle) * labelRadius;
            ctx.fillText(i.toString(), x, y);
        }

        // Colored progress arc
        const gradient = ctx.createLinearGradient(0, centerY, w, centerY);
        gradient.addColorStop(0, '#ff3333');
        gradient.addColorStop(0.33, '#ffaa00');
        gradient.addColorStop(0.66, '#ffff00');
        gradient.addColorStop(1, '#00ff00');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Needle with color based on performance
        const needleAngle = valueAngle;
        const needleLength = radius - 10;
        const needleX = centerX + Math.cos(needleAngle) * needleLength;
        const needleY = centerY + Math.sin(needleAngle) * needleLength;

        let needleColor;
        if (percent < 33) {
            needleColor = '#ff3333';
        } else if (percent < 66) {
            needleColor = '#ffcc00';
        } else {
            needleColor = '#00ff00';
        }

        ctx.strokeStyle = needleColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = needleColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(needleX, needleY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Small LED indicator at needle tip
        ctx.fillStyle = needleColor;
        ctx.shadowColor = needleColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(needleX, needleY, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Center dot
        ctx.fillStyle = '#4ecbff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Inner glow
        ctx.strokeStyle = 'rgba(78, 203, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

window.updateGauges = updateGauges;

if (window.latestMinerData) {
    updateGauges();
}
