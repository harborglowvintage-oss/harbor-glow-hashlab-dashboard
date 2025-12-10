// BTC Real-Time Tracker Orb - based on network-orb.js
// This is a direct copy of the data transfer orb (network-orb.js) for further BTC-specific adaptation.
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'btc-realtime-orb-canvas';
    canvas.style.position = 'fixed';
    canvas.style.bottom = '126px'; // moved down by 1 inch (96px)
    canvas.style.left = '126px'; // moved left by 1 inch (96px)
    canvas.style.width = '340px';
    canvas.style.height = '340px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = 340;
    canvas.height = 340;
    const centerX = 170;
    const centerY = 170;
    const orbRadius = 35 * 1.25 * 1.25 * 1.25;
    // Create data particles that orbit in 3D space around the orb
    const particles = [];
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        // Add more color variety: orange, red, yellow, white, gold, pink, purple
        const colorHues = [25, 35, 45, 55, 15, 5, 0, 320, 300, 270];
        const hue = colorHues[Math.floor(Math.random() * colorHues.length)] + Math.random() * 10;
        particles.push({
            theta: theta,
            phi: phi,
            thetaSpeed: (Math.random() - 0.5) * 0.03,
            phiSpeed: (Math.random() - 0.5) * 0.02,
            distance: 70 + Math.random() * 30,
            size: 2 + Math.random() * 3,
            hue: hue,
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.05 + 0.02
        });
    }

    // BTC price label
    const btcLabel = {
        theta: Math.PI / 2,
        phi: Math.PI / 2,
        distance: orbRadius + 38,
        speed: 0.04,
        price: null,
        label: 'BTC: ...',
        color: 'rgba(255,255,255,0.97)'
    };

    // 24H change label
    const changeLabel = {
        theta: Math.PI / 2 + Math.PI, // opposite side
        phi: Math.PI / 2,
        distance: orbRadius + 58,
        speed: 0.035,
        change: null,
        label: '...%',
        color: 'rgba(255,255,255,0.97)'
    };

    async function fetchBTCPriceAndChange() {
        try {
            const res = await fetch('/btc-price-24h', { credentials: 'include' });
            if (!res.ok) {
                throw new Error(`Price endpoint returned ${res.status}`);
            }
            const data = await res.json();
            if (data && data.success && data.price) {
                btcLabel.price = data.price;
                btcLabel.label = `₿ $${btcLabel.price.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
                // Color logic for price: blue if up, red if down
                if (typeof data.change_24h === 'number') {
                    if (data.change_24h >= 0) {
                        btcLabel.color = 'rgba(60,180,255,0.97)'; // blue
                    } else {
                        btcLabel.color = 'rgba(255,60,60,0.97)'; // red
                    }
                } else {
                    btcLabel.color = 'rgba(255,255,255,0.97)';
                }
                // 24H change label
                if (typeof data.change_24h === 'number') {
                    changeLabel.change = data.change_24h;
                    const sign = data.change_24h >= 0 ? '+' : '';
                    const arrow = data.change_24h > 0 ? '↑' : (data.change_24h < 0 ? '↓' : '→');
                    changeLabel.label = `${sign}${data.change_24h.toFixed(2)}% ${arrow} 24H`;
                    changeLabel.color = data.change_24h >= 0 ? 'rgba(60,180,255,0.97)' : 'rgba(255,60,60,0.97)';
                } else {
                    changeLabel.label = '...% 24H';
                    changeLabel.color = 'rgba(255,255,255,0.97)';
                }
            } else {
                btcLabel.label = 'BTC: ...';
                btcLabel.color = 'rgba(255,255,255,0.97)';
                changeLabel.label = '...%';
                changeLabel.color = 'rgba(255,255,255,0.97)';
            }
        } catch (error) {
            console.error('BTC price refresh failed:', error);
            btcLabel.label = 'BTC: ...';
            btcLabel.color = 'rgba(255,255,255,0.97)';
            changeLabel.label = '...%';
            changeLabel.color = 'rgba(255,255,255,0.97)';
        }
    }
    fetchBTCPriceAndChange();
    setInterval(fetchBTCPriceAndChange, 10000);
    function drawOrb() {
        // Outer glow - orange
        const outerGlow = ctx.createRadialGradient(centerX, centerY, orbRadius * 0.5, centerX, centerY, orbRadius * 2);
        outerGlow.addColorStop(0, 'rgba(255, 180, 40, 0.5)');
        outerGlow.addColorStop(0.5, 'rgba(255, 120, 0, 0.2)');
        outerGlow.addColorStop(1, 'rgba(120, 60, 0, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2);
        ctx.fill();
        // Main orb - orange/yellow
        const planetGradient = ctx.createRadialGradient(
            centerX - orbRadius * 0.3,
            centerY - orbRadius * 0.3,
            orbRadius * 0.1,
            centerX,
            centerY,
            orbRadius
        );
        planetGradient.addColorStop(0, 'rgba(255, 220, 100, 0.95)');
        planetGradient.addColorStop(0.4, 'rgba(255, 180, 50, 0.85)');
        planetGradient.addColorStop(1, 'rgba(200, 120, 30, 0.7)');
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
        ctx.fill();
        // Surface detail rings - orange
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 5, orbRadius * 0.8, orbRadius * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Inner shine - white
        ctx.fillStyle = 'rgba(255, 250, 200, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - orbRadius * 0.25, centerY - orbRadius * 0.25, orbRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        // Core pulse - white/orange
        const time = Date.now() * 0.002;
        const pulseSize = orbRadius * 0.15 * (1 + Math.sin(time) * 0.2);
        const pulseGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
        pulseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        pulseGradient.addColorStop(1, 'rgba(255, 220, 150, 0)');
        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
    }
    function drawParticles() {
        particles.forEach(particle => {
            particle.theta += particle.thetaSpeed;
            particle.phi += particle.phiSpeed;
            particle.phase += particle.wobbleSpeed;
            const wobble = Math.sin(particle.phase) * 5;
            const distance = particle.distance + wobble;
            const x = centerX + distance * Math.sin(particle.phi) * Math.cos(particle.theta);
            const y = centerY + distance * Math.sin(particle.phi) * Math.sin(particle.theta);
            const z = distance * Math.cos(particle.phi);
            const depthScale = (z + distance) / (distance * 2);
            const actualSize = particle.size * (0.5 + depthScale * 0.5);
            const opacity = 0.3 + depthScale * 0.7;
            // Orange/red particle lines
            ctx.strokeStyle = `hsla(${30 + particle.hue % 60}, 90%, 60%, ${opacity * 0.18})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
            // Orange/red particle glow
            const color = `hsla(${20 + particle.hue % 40}, 98%, 60%, ${opacity})`;
            const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, actualSize * 4);
            particleGlow.addColorStop(0, color);
            particleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(x, y, actualSize * 4, 0, Math.PI * 2);
            ctx.fill();
            // Particle core - white
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, actualSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
            ctx.beginPath();
            ctx.arc(x, y, actualSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    function drawDataLabels() {
        // Animate BTC price label
        btcLabel.theta += btcLabel.speed;
        btcLabel.speed *= 0.99;
        btcLabel.speed = Math.max(0.01, btcLabel.speed);
        const btcX = centerX + btcLabel.distance * Math.sin(btcLabel.phi) * Math.cos(btcLabel.theta);
        const btcY = centerY + btcLabel.distance * Math.sin(btcLabel.phi) * Math.sin(btcLabel.theta);
        ctx.save();
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 6;
        // Prevent text cutoff by checking bounds
        const btcText = btcLabel.label;
        const btcTextWidth = ctx.measureText(btcText).width;
        let drawBtcX = btcX;
        if (btcX - btcTextWidth / 2 < 0) drawBtcX = btcTextWidth / 2 + 2;
        if (btcX + btcTextWidth / 2 > canvas.width) drawBtcX = canvas.width - btcTextWidth / 2 - 2;
        ctx.strokeText(btcText, drawBtcX, btcY);
        ctx.fillStyle = btcLabel.color;
        ctx.fillText(btcText, drawBtcX, btcY);
        ctx.restore();

        // Animate 24H change label (orbits opposite)
        changeLabel.theta += changeLabel.speed;
        changeLabel.speed *= 0.99;
        changeLabel.speed = Math.max(0.01, changeLabel.speed);
        const chgX = centerX + changeLabel.distance * Math.sin(changeLabel.phi) * Math.cos(changeLabel.theta);
        const chgY = centerY + changeLabel.distance * Math.sin(changeLabel.phi) * Math.sin(changeLabel.theta);
        ctx.save();
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 5;
        // Prevent text cutoff by checking bounds
        const chgText = changeLabel.label;
        const chgTextWidth = ctx.measureText(chgText).width;
        let drawChgX = chgX;
        if (chgX - chgTextWidth / 2 < 0) drawChgX = chgTextWidth / 2 + 2;
        if (chgX + chgTextWidth / 2 > canvas.width) drawChgX = canvas.width - chgTextWidth / 2 - 2;
        ctx.strokeText(chgText, drawChgX, chgY);
        ctx.fillStyle = changeLabel.color;
        ctx.fillText(chgText, drawChgX, chgY);
        ctx.restore();
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawOrb();
        drawParticles();
        drawDataLabels();
        requestAnimationFrame(animate);
    }
    animate();
});
