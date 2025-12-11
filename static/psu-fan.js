// PSU Fan visualization - Alien Spaceship Style
function initPSUFan() {
    const container = document.getElementById('psu-fan-container');
    if (!container) return;

    container.innerHTML = '';

    const FAN_SIZE = 140;
    const center = FAN_SIZE / 2;
    let targetSpeed = 1;

    function createFan(initialRotation = 0) {
        const canvas = document.createElement('canvas');
        canvas.width = FAN_SIZE;
        canvas.height = FAN_SIZE;
        canvas.style.width = `${FAN_SIZE}px`;
        canvas.style.height = `${FAN_SIZE}px`;
        canvas.classList.add('psu-fan-canvas');
        canvas.setAttribute('aria-hidden', 'true');
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let rotation = initialRotation;
        let currentSpeed = 0;
        let glowPulse = Math.random() * Math.PI * 2;

        function drawFan() {
            ctx.clearRect(0, 0, FAN_SIZE, FAN_SIZE);
            glowPulse += 0.05;

            // Outer alien hull
            ctx.save();
            const gradient = ctx.createRadialGradient(center, center, 30, center, center, 65);
            gradient.addColorStop(0, '#0a0a0a');
            gradient.addColorStop(0.7, '#1a1a2a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(center, center, 65, 0, Math.PI * 2);
            ctx.fill();

            // Alien tech border rings (optimized: 2 instead of 3)
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(center, center, 65 - (i * 8), 0, Math.PI * 2);
                const alpha = 0.3 + Math.sin(glowPulse + i) * 0.2;
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                ctx.lineWidth = 1 + i * 0.5;
                ctx.stroke();
            }

            // Hexagonal energy nodes
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const x = center + Math.cos(angle) * 52;
                const y = center + Math.sin(angle) * 52;

                ctx.beginPath();
                for (let j = 0; j < 6; j++) {
                    const hAngle = (Math.PI / 3) * j;
                    const hx = x + Math.cos(hAngle) * 4;
                    const hy = y + Math.sin(hAngle) * 4;
                    if (j === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();

                const nodeGlow = ctx.createRadialGradient(x, y, 0, x, y, 5);
                nodeGlow.addColorStop(0, `rgba(0, 255, 255, ${0.8 + Math.sin(glowPulse + i * 0.5) * 0.2})`);
                nodeGlow.addColorStop(1, 'rgba(0, 100, 100, 0.2)');
                ctx.fillStyle = nodeGlow;
                ctx.fill();
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Energy conduits connecting to center
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const x1 = center + Math.cos(angle) * 20;
                const y1 = center + Math.sin(angle) * 20;
                const x2 = center + Math.cos(angle) * 52;
                const y2 = center + Math.sin(angle) * 52;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Rotating alien turbine blades
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(rotation);

            const numBlades = 8;
            for (let i = 0; i < numBlades; i++) {
                const angle = (Math.PI * 2 / numBlades) * i;

                ctx.save();
                ctx.rotate(angle);

                // Alien blade shape with energy trails
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.quadraticCurveTo(25, -4, 38, -3);
                ctx.lineTo(40, 0);
                ctx.lineTo(38, 3);
                ctx.quadraticCurveTo(25, 4, 10, 0);
                ctx.closePath();

                // Blade gradient with cyan energy
                const bladeGrad = ctx.createLinearGradient(10, 0, 40, 0);
                bladeGrad.addColorStop(0, '#1a1a2a');
                bladeGrad.addColorStop(0.3, '#00ffff');
                bladeGrad.addColorStop(0.7, '#00cccc');
                bladeGrad.addColorStop(1, '#006666');
                ctx.fillStyle = bladeGrad;
                ctx.fill();

                // Energy glow on blade edge
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(glowPulse) * 0.3})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.restore();
            }

            // Central power core
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
            coreGradient.addColorStop(0, `rgba(0, 255, 255, ${0.9 + Math.sin(glowPulse * 2) * 0.1})`);
            coreGradient.addColorStop(0.5, 'rgba(0, 200, 200, 0.6)');
            coreGradient.addColorStop(1, 'rgba(0, 100, 100, 0.3)');

            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();

            // Core ring detail
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner core symbol
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, 4 + i * 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();

            // Update rotation based on load
            currentSpeed += (targetSpeed - currentSpeed) * 0.1;
            rotation += currentSpeed * 0.05;

            requestAnimationFrame(drawFan);
        }

        drawFan();
    }

    // Build twin fans with a small phase offset so they feel independent
    createFan(0);
    createFan(Math.PI / 6);

    // Update wattage display
    window.updatePSUWattage = function(totalWatts) {
        const wattageDisplay = document.getElementById('psu-wattage');
        if (wattageDisplay) {
            wattageDisplay.textContent = totalWatts.toFixed(0) + 'W';
        }

        // Adjust fan speed based on load (faster with more watts)
        targetSpeed = Math.min(3, 0.5 + (totalWatts / 5000));
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPSUFan);
} else {
    initPSUFan();
}
