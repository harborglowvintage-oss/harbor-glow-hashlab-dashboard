// Teal Core Orb positioned between data orb and BTC orb
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.createElement('canvas');
        canvas.id = 'teal-core-orb';
        canvas.style.position = 'fixed';
        canvas.style.top = '200px';
        canvas.style.left = '0px';
        canvas.style.width = '520px';
        canvas.style.height = '520px';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '105';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = 520;
        canvas.height = 520;
        const centerX = 260;
        const centerY = 260;
        const orbRadius = 140 * 0.7; // 30% smaller than original

        // Swarmgate-style arc text
        const existingArc = document.getElementById('core-teal-svg');
        if (existingArc) existingArc.remove();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'core-teal-svg');
        svg.setAttribute('width', 480);
        svg.setAttribute('height', 480);
        svg.style.position = 'fixed';
        svg.style.top = '190px';
        svg.style.left = '20px';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '106';

        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('id', 'core-teal-arc');
        arc.setAttribute('d', `M 80 240 A 180 180 0 1 1 400 240`);
        arc.setAttribute('fill', 'none');
        svg.appendChild(arc);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('font-family', 'Impact, Arial Black, sans-serif');
        text.setAttribute('font-size', '19');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('letter-spacing', '0.08em');
        text.setAttribute('textLength', '210');
        text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        text.setAttribute('style', 'text-shadow:0 0 10px #00f6ff,0 0 22px #00f6ff,0 0 3px #ffffff;');
        const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#core-teal-arc');
        textPath.setAttribute('startOffset', '50%');
        textPath.setAttribute('text-anchor', 'middle');
        textPath.textContent = 'POWERED BY BTCMINERGPT.AI';
        text.appendChild(textPath);
        svg.appendChild(text);
        document.body.appendChild(svg);

        // Particles reused from network orb
        const particles = [];
        const particleCount = 25;
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            particles.push({
                theta,
                phi,
                thetaSpeed: (Math.random() - 0.5) * 0.02,
                phiSpeed: (Math.random() - 0.5) * 0.015,
                distance: 140 + Math.random() * 60,
                size: 3 + Math.random() * 4,
                hue: 160 + Math.random() * 40,
                phase: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.04 + 0.02
            });
        }

        const uploadLabel = {
            theta: Math.PI / 2,
            phi: Math.PI / 2.2,
            distance: orbRadius + 40,
            speed: 0.03,
            total: 0,
            label: '↑0.0MB'
        };

        const downloadLabel = {
            theta: Math.PI / 2 + Math.PI,
            phi: Math.PI / 2.2,
            distance: orbRadius + 70,
            speed: 0.03,
            total: 0,
            label: '↓0.0MB'
        };

        setInterval(() => {
            uploadLabel.total += Math.random() * 8;
            uploadLabel.label = `↑${uploadLabel.total.toFixed(1)}MB`;
            uploadLabel.speed = Math.min(0.08, uploadLabel.speed + 0.01);
        }, 1500);

        setInterval(() => {
            downloadLabel.total += Math.random() * 10;
            downloadLabel.label = `↓${downloadLabel.total.toFixed(1)}MB`;
            downloadLabel.speed = Math.min(0.08, downloadLabel.speed + 0.01);
        }, 1800);

        function drawOrb() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const outerGlow = ctx.createRadialGradient(centerX, centerY, orbRadius * 0.5, centerX, centerY, orbRadius * 2.2);
            outerGlow.addColorStop(0, 'rgba(0, 255, 230, 0.45)');
            outerGlow.addColorStop(0.5, 'rgba(0, 180, 200, 0.25)');
            outerGlow.addColorStop(1, 'rgba(0, 90, 110, 0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbRadius * 2.2, 0, Math.PI * 2);
            ctx.fill();

            const gradient = ctx.createRadialGradient(centerX - orbRadius * 0.3, centerY - orbRadius * 0.3, orbRadius * 0.2, centerX, centerY, orbRadius);
            gradient.addColorStop(0, '#bffeff');
            gradient.addColorStop(0.4, '#32f4ff');
            gradient.addColorStop(1, '#018d9c');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
            ctx.fill();

            drawTubeCity();

            ctx.strokeStyle = 'rgba(0,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 6, orbRadius * 0.75, orbRadius * 0.18, 0, 0, Math.PI * 2);
            ctx.stroke();

            const time = Date.now() * 0.002;
            const pulseSize = orbRadius * 0.3 * (1 + Math.sin(time) * 0.2);
            const pulse = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
            pulse.addColorStop(0, 'rgba(255,255,255,0.9)');
            pulse.addColorStop(1, 'rgba(0,255,255,0)');
            ctx.fillStyle = pulse;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawTubeCity() {
            const tubeCount = 14;
            for (let i = 0; i < tubeCount; i++) {
                const angle = (Math.PI * 2 * i) / tubeCount;
                const inner = orbRadius * 0.18 + (i % 2) * orbRadius * 0.03;
                const outer = orbRadius * (0.38 + (i % 3) * 0.05);
                const baseX = centerX + Math.cos(angle) * inner;
                const baseY = centerY + Math.sin(angle) * inner;
                const topX = centerX + Math.cos(angle) * outer;
                const topY = centerY + Math.sin(angle) * outer;

                const gradient = ctx.createLinearGradient(baseX, baseY, topX, topY);
                gradient.addColorStop(0, 'rgba(0,60,80,0.7)');
                gradient.addColorStop(0.45, 'rgba(0,210,230,0.9)');
                gradient.addColorStop(0.85, 'rgba(220,255,255,0.8)');
                gradient.addColorStop(1, 'rgba(255,255,255,0.55)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(baseX, baseY);
                ctx.lineTo(topX, topY);
                ctx.stroke();

                // tiny vacuum eye
                const glow = ctx.createRadialGradient(topX, topY, 0, topX, topY, 10);
                glow.addColorStop(0, 'rgba(255,255,255,0.95)');
                glow.addColorStop(1, 'rgba(0,255,235,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(topX, topY, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            // microchip traces
            ctx.strokeStyle = 'rgba(0,255,255,0.25)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 20; i++) {
                const a1 = Math.random() * Math.PI * 2;
                const a2 = a1 + (Math.random() * 0.6 - 0.3);
                const r1 = orbRadius * (0.2 + Math.random() * 0.3);
                const r2 = r1 + orbRadius * (0.15 + Math.random() * 0.1);
                const x1 = centerX + Math.cos(a1) * r1;
                const y1 = centerY + Math.sin(a1) * r1;
                const x2 = centerX + Math.cos(a2) * r2;
                const y2 = centerY + Math.sin(a2) * r2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // scatter micro bulbs
            for (let i = 0; i < 25; i++) {
                const ang = Math.random() * Math.PI * 2;
                const radius = orbRadius * (0.15 + Math.random() * 0.55);
                const x = centerX + Math.cos(ang) * radius;
                const y = centerY + Math.sin(ang) * radius;
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.arc(x, y, 2.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawParticles() {
            particles.forEach(p => {
                p.theta += p.thetaSpeed;
                p.phi += p.phiSpeed;
                p.phase += p.wobbleSpeed;
                const wobble = Math.sin(p.phase) * 8;
                const distance = p.distance + wobble;
                const x = centerX + distance * Math.sin(p.phi) * Math.cos(p.theta);
                const y = centerY + distance * Math.sin(p.phi) * Math.sin(p.theta);
                const z = distance * Math.cos(p.phi);
                const depthScale = (z + distance) / (distance * 2);
                const actualSize = p.size * (0.6 + depthScale * 0.5);
                const opacity = 0.2 + depthScale * 0.8;

                ctx.strokeStyle = `hsla(${p.hue}, 85%, 60%, ${opacity * 0.12})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();

                const glow = ctx.createRadialGradient(x, y, 0, x, y, actualSize * 4);
                glow.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${opacity})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, actualSize * 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, actualSize, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function drawLabels() {
            uploadLabel.theta += uploadLabel.speed;
            uploadLabel.speed = Math.max(0.015, uploadLabel.speed * 0.99);
            const upX = centerX + uploadLabel.distance * Math.sin(uploadLabel.phi) * Math.cos(uploadLabel.theta);
            const upY = centerY + uploadLabel.distance * Math.sin(uploadLabel.phi) * Math.sin(uploadLabel.theta);

            downloadLabel.theta += downloadLabel.speed;
            downloadLabel.speed = Math.max(0.015, downloadLabel.speed * 0.99);
            const downX = centerX + downloadLabel.distance * Math.sin(downloadLabel.phi) * Math.cos(downloadLabel.theta);
            const downY = centerY + downloadLabel.distance * Math.sin(downloadLabel.phi) * Math.sin(downloadLabel.theta);

            ctx.font = '700 20px "Share Tech Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = 'rgba(0,255,255,0.9)';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 12;
            ctx.fillText(uploadLabel.label, upX, upY);

            ctx.fillStyle = 'rgba(0,255,180,0.9)';
            ctx.shadowColor = '#00ffb4';
            ctx.fillText(downloadLabel.label, downX, downY);
            ctx.shadowBlur = 0;
        }

        function animate() {
            drawOrb();
            drawParticles();
            drawLabels();
            requestAnimationFrame(animate);
        }

        animate();
    });
})();
