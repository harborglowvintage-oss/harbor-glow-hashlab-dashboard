// BTC Real-Time Tracker Orb - based on network-orb.js
// This is a direct copy of the data transfer orb (network-orb.js) for further BTC-specific adaptation.
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'btc-realtime-orb-canvas';
    canvas.style.position = 'fixed';
    canvas.style.bottom = '30px';
    canvas.style.left = '30px';
    canvas.style.width = '250px';
    canvas.style.height = '250px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = 250;
    canvas.height = 250;
    const centerX = 125;
    const centerY = 125;
    const orbRadius = 35;
    // Create data particles that orbit in 3D space around the orb
    const particles = [];
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        particles.push({
            theta: theta,
            phi: phi,
            thetaSpeed: (Math.random() - 0.5) * 0.03,
            phiSpeed: (Math.random() - 0.5) * 0.02,
            distance: 70 + Math.random() * 30,
            size: 2 + Math.random() * 3,
            hue: Math.random() * 360,
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.05 + 0.02
        });
    }
    // BTC price label floating around the sphere
    const btcLabel = {
        theta: Math.PI / 2,
        phi: Math.PI / 2,
        distance: 70,
        speed: 0.04,
        price: null,
        label: 'BTC: ...'
    };

    async function fetchBTCPrice() {
        try {
            const res = await fetch('/btc-price');
            const data = await res.json();
            if (data && data.success && data.price) {
                btcLabel.price = data.price;
                btcLabel.label = `₿ $${btcLabel.price.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
            } else {
                btcLabel.label = 'BTC: ...';
            }
        } catch {
            btcLabel.label = 'BTC: ...';
        }
    }
    fetchBTCPrice();
    setInterval(fetchBTCPrice, 10000);
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
        btcLabel.theta += btcLabel.speed;
        btcLabel.speed *= 0.99;
        btcLabel.speed = Math.max(0.01, btcLabel.speed);
        const btcX = centerX + btcLabel.distance * Math.sin(btcLabel.phi) * Math.cos(btcLabel.theta);
        const btcY = centerY + btcLabel.distance * Math.sin(btcLabel.phi) * Math.sin(btcLabel.theta);
        ctx.save();
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.85)';
        ctx.lineWidth = 5;
        ctx.strokeText(btcLabel.label, btcX, btcY);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
        ctx.fillText(btcLabel.label, btcX, btcY);
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
