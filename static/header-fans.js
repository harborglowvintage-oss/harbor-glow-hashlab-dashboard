// Micro fans for header (DPR-aware, scalable, +20% visual intensity)
document.addEventListener('DOMContentLoaded', function() {
    const fanLeft = document.querySelector('.h1-fan-left');
    const fanRight = document.querySelector('.h1-fan-right');
    if (!fanLeft || !fanRight) return;

    // Visual scale multiplier for effect increases (20%)
    const effectMul = 1.2;

    function setupCanvas(canvas) {
        // Determine CSS size (falls back to 72 if not set)
        const cs = getComputedStyle(canvas);
        let cssW = parseFloat(cs.width) || 72;
        let cssH = parseFloat(cs.height) || cssW;

        // Device pixel ratio scaling for crisp blades
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels
        return {ctx, w: cssW, h: cssH};
    }

    let left = setupCanvas(fanLeft);
    let right = setupCanvas(fanRight);

    let rotationLeft = 0;
    let rotationRight = 0;
    let pulsePhase = 0;

    function drawMicroFan(ctx, w, h, rotation, isPulse) {
        const cx = w / 2;
        const cy = h / 2;
        const margin = Math.max(6, Math.round(Math.min(w, h) * 0.08));
        const radius = Math.min(w, h) / 2 - margin;

        const pulse = 1 + Math.sin(isPulse) * 0.15 * effectMul;


        // Outer glow rings (2 rings) with increased alpha
        for (let i = 2; i > 0; i--) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius + (i * 3), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(0.25, (0.15 / i) * effectMul)})`;
            ctx.lineWidth = 2 * effectMul;
            ctx.stroke();
        }

        // White ring with metallic beveled edge
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 5 * effectMul, 0, Math.PI * 2);
        // Metallic gradient
        let metalGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
        metalGrad.addColorStop(0, '#e0e0e0');
        metalGrad.addColorStop(0.2, '#ffffff');
        metalGrad.addColorStop(0.5, '#b0b0b0');
        metalGrad.addColorStop(0.8, '#ffffff');
        metalGrad.addColorStop(1, '#e0e0e0');
        ctx.strokeStyle = metalGrad;
        ctx.lineWidth = 6 * effectMul;
        ctx.shadowBlur = 8 * effectMul;
        ctx.shadowColor = 'rgba(255,255,255,0.7)';
        ctx.globalAlpha = 0.92;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();

        // Inner white ring for highlight
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2 * effectMul, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2.5 * effectMul;
        ctx.shadowBlur = 6 * effectMul;
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Main outer ring (cyan tech)
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3 * effectMul;
        ctx.shadowBlur = 10 * effectMul;
        ctx.shadowColor = `rgba(0,255,255,${0.8 * effectMul})`;
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Smoke effect from center drifting left
        function drawSmoke(cx, cy, baseR, rotation, layers = 7) {
            for (let i = 0; i < layers; i++) {
                const angle = -Math.PI / 2 - 0.25 + Math.sin(rotation * 0.7 + i * 0.3) * 0.12;
                const len = baseR * (0.7 + 0.18 * i);
                const thickness = 7 * effectMul * (1 - i / layers) + Math.random() * 2;
                const alpha = 0.13 + 0.09 * (1 - i / layers);
                ctx.save();
                ctx.beginPath();
                // Smoke path: from center, curve left
                ctx.moveTo(cx, cy);
                ctx.bezierCurveTo(
                    cx - baseR * 0.18,
                    cy - baseR * 0.12 + i * 2,
                    cx - len * 0.7,
                    cy - len * 0.2 + i * 2,
                    cx - len,
                    cy - len * 0.08 + i * 2
                );
                ctx.strokeStyle = `rgba(220,220,220,${alpha})`;
                ctx.lineWidth = thickness;
                ctx.shadowBlur = 12 * effectMul * (1 - i / layers);
                ctx.shadowColor = 'rgba(255,255,255,0.18)';
                ctx.globalAlpha = alpha;
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }
        drawSmoke(cx, cy, radius * 0.85, rotation, 7 + Math.floor(Math.random() * 2));

        // Tech ring segments
        const segs = 12;
        for (let i = 0; i < segs; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((Math.PI * 2 * i) / segs);
            ctx.beginPath();
            ctx.moveTo(radius - 4 * effectMul, 0);
            ctx.lineTo(radius + 2 * effectMul, 0);
            ctx.strokeStyle = i % 2 === 0 ? '#00ffff' : `rgba(0,255,255,${0.45 * effectMul})`;
            ctx.lineWidth = 2 * effectMul * 0.9;
            ctx.stroke();
            ctx.restore();
        }

        // Fan blades
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        const blades = 8;
        for (let i = 0; i < blades; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 * i) / blades);

            const bladeLen = radius - 6 * effectMul;
            const bStart = 3 * effectMul;

            // Smooth blade using bezier for better visual
            ctx.beginPath();
            ctx.moveTo(bStart, -1 * effectMul);
            ctx.bezierCurveTo(bladeLen * 0.15, -6 * effectMul, bladeLen * 0.6, -4 * effectMul, bladeLen, -1 * effectMul);
            ctx.lineTo(bladeLen, 1 * effectMul);
            ctx.bezierCurveTo(bladeLen * 0.6, 4 * effectMul, bladeLen * 0.15, 6 * effectMul, bStart, 1 * effectMul);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(bStart, 0, bladeLen, 0);
            gradient.addColorStop(0, `rgba(0,255,255,${0.95 * effectMul})`);
            gradient.addColorStop(0.35, `rgba(0,220,255,${0.85 * effectMul})`);
            gradient.addColorStop(0.65, `rgba(0,180,200,${0.65 * effectMul})`);
            gradient.addColorStop(1, `rgba(0,150,180,${0.35 * effectMul})`);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Blade edge
            ctx.strokeStyle = `rgba(0,255,255,${0.95 * effectMul})`;
            ctx.lineWidth = 1.6 * effectMul;
            ctx.shadowBlur = 6 * effectMul;
            ctx.shadowColor = `rgba(0,255,255,${0.8 * effectMul})`;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Inner tech stripe
            ctx.beginPath();
            ctx.moveTo(bStart + bladeLen * 0.12, 0);
            ctx.lineTo(bladeLen - bladeLen * 0.12, 0);
            ctx.strokeStyle = `rgba(255,255,255,${0.32 * effectMul})`;
            ctx.lineWidth = 1 * effectMul;
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();

        // Center hub
        const hubR = 8 * effectMul * pulse;
        const hubGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, hubR);
        hubGradient.addColorStop(0, '#ffffff');
        hubGradient.addColorStop(0.35, '#00ffff');
        hubGradient.addColorStop(0.7, '#0099cc');
        hubGradient.addColorStop(1, '#006688');

        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = hubGradient;
        ctx.shadowBlur = 18 * effectMul;
        ctx.shadowColor = `rgba(0,255,255,${0.9 * effectMul})`;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2 * effectMul;
        ctx.stroke();

        // Inner rivets
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 * i) / 6 + rotation * 0.5);
            ctx.beginPath();
            ctx.arc(4 * effectMul, 0, 1 * effectMul, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    function animate() {
        // update rotation speeds slightly faster (+20%)
        rotationLeft += 0.12 * effectMul;
        rotationRight += 0.12 * effectMul;
        pulsePhase += 0.05 * effectMul;

        // Clear pixel buffer for each canvas (clear full pixel dimensions)
        const dpr = window.devicePixelRatio || 1;
        left.ctx.clearRect(0, 0, Math.round(left.w * dpr), Math.round(left.h * dpr));
        right.ctx.clearRect(0, 0, Math.round(right.w * dpr), Math.round(right.h * dpr));

        drawMicroFan(left.ctx, left.w, left.h, rotationLeft, pulsePhase);
        drawMicroFan(right.ctx, right.w, right.h, rotationRight, pulsePhase + 1.2);

        requestAnimationFrame(animate);
    }

    // Re-setup on resize to keep crispness and correct circular size
    window.addEventListener('resize', () => {
        // reinitialize canvases and re-bind contexts for crispness
        left = setupCanvas(fanLeft);
        right = setupCanvas(fanRight);
    });

    animate();
});
