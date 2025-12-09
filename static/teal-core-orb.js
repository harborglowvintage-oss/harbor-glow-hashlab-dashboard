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
        canvas.style.transformOrigin = '50% 50%';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = 520;
        canvas.height = 520;
        const centerX = 260;
        const centerY = 260;
        const orbRadius = 140 * 0.7 * 0.9; // shrink orb by additional 10%
        const spinTargets = [];
        spinTargets.push(canvas);

        // Ensure eye animation styles exist
        const eyeStyleId = 'teal-eye-effects';
        if (!document.getElementById(eyeStyleId)) {
            const pulseStyle = document.createElement('style');
            pulseStyle.id = eyeStyleId;
            pulseStyle.textContent = `
                @keyframes tealEyePulse {
                    0% { transform: scale(0.8); opacity: 0.2; }
                    50% { transform: scale(1); opacity: 0.65; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                @keyframes tealEyeCue {
                    0%,100% { opacity: 0.85; transform: translateY(0); }
                    50% { opacity: 0.35; transform: translateY(-6px); }
                }
                @keyframes tealEyeBlink {
                    0%, 93%, 100% { transform: translateY(-140%); opacity: 0; }
                    95% { transform: translateY(-45%); opacity: 0.85; }
                    97% { transform: translateY(0); opacity: 1; }
                    98.5% { transform: translateY(-60%); opacity: 0.4; }
                }
                @keyframes tealEyeBlinkBottom {
                    0%, 93%, 100% { transform: translateY(140%); opacity: 0; }
                    95% { transform: translateY(45%); opacity: 0.85; }
                    97% { transform: translateY(0); opacity: 1; }
                    98.5% { transform: translateY(60%); opacity: 0.4; }
                }
                @keyframes tealOrbSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .teal-core-spin {
                    animation: tealOrbSpin 2.4s linear infinite;
                }
            `;
            document.head.appendChild(pulseStyle);
        }

        // Interactive GPT eye overlay
        const existingEye = document.getElementById('teal-orb-eye');
        if (existingEye) existingEye.remove();
        const existingCue = document.getElementById('teal-eye-cue');
        if (existingCue) existingCue.remove();
        const eyeButton = document.createElement('button');
        eyeButton.id = 'teal-orb-eye';
        eyeButton.setAttribute('aria-label', 'Open GPT engine console');
        eyeButton.innerHTML = '<span class=\"eye-ring\"></span><span class=\"eye-iris\"></span><span class=\"eye-glow\"></span>';
        Object.assign(eyeButton.style, {
            position: 'fixed',
            top: `${200 + centerY - 38}px`,
            left: `${centerX - 38}px`,
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            border: '2px solid rgba(0,255,243,0.55)',
            background: 'radial-gradient(circle, rgba(0,255,255,0.7) 0%, rgba(0,110,150,0.8) 60%, rgba(0,30,40,0.95) 100%)',
            boxShadow: '0 0 18px rgba(0,255,255,0.65)',
            cursor: 'pointer',
            zIndex: '210',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        });
        eyeButton.addEventListener('mouseenter', () => {
            eyeButton.style.transform = 'scale(1.08)';
            eyeButton.style.boxShadow = '0 0 26px rgba(0,255,255,0.9)';
        });
        eyeButton.addEventListener('mouseleave', () => {
            eyeButton.style.transform = 'scale(1)';
            eyeButton.style.boxShadow = '0 0 18px rgba(0,255,255,0.65)';
        });
        const eyeRing = eyeButton.querySelector('.eye-ring');
        eyeRing.style.cssText = `
            position: absolute;
            width: 110px;
            height: 110px;
            border-radius: 50%;
            border: 2px solid rgba(0,255,255,0.28);
            animation: tealEyePulse 3.6s ease-out infinite;
            pointer-events: none;
        `;
        const eyeIris = eyeButton.querySelector('.eye-iris');
        eyeIris.style.cssText = `
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(0,255,255,0.6) 55%, rgba(0,60,80,0.9) 100%);
            box-shadow: inset 0 0 12px rgba(0,0,0,0.7);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.04s ease-out;
        `;
        const pupil = document.createElement('span');
        pupil.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #ffffff 0%, #00cfff 55%, #002842 100%);
            box-shadow: 0 0 8px rgba(0,255,255,0.7);
        `;
        eyeIris.appendChild(pupil);

        eyeButton.querySelector('.eye-glow').style.cssText = `
            position: absolute;
            width: 92px;
            height: 92px;
            border-radius: 50%;
            box-shadow: 0 0 45px rgba(0,255,255,0.45);
            pointer-events: none;
        `;
        const topLid = document.createElement('span');
        topLid.style.cssText = `
            position: absolute;
            width: 74px;
            height: 40px;
            top: -6px;
            border-radius: 50% 50% 0 0;
            background: linear-gradient(180deg, rgba(0,28,34,0.9) 0%, rgba(0,10,12,0.1) 100%);
            border-top: 1px solid rgba(0,255,255,0.25);
            border-left: 1px solid rgba(0,255,255,0.08);
            border-right: 1px solid rgba(0,255,255,0.08);
            animation: tealEyeBlink 11s cubic-bezier(0.42, 0, 0.58, 1) infinite;
            pointer-events: none;
        `;
        const bottomLid = document.createElement('span');
        bottomLid.style.cssText = `
            position: absolute;
            width: 74px;
            height: 40px;
            bottom: -6px;
            border-radius: 0 0 50% 50%;
            background: linear-gradient(0deg, rgba(0,28,34,0.9) 0%, rgba(0,10,12,0.1) 100%);
            border-bottom: 1px solid rgba(0,255,255,0.25);
            border-left: 1px solid rgba(0,255,255,0.08);
            border-right: 1px solid rgba(0,255,255,0.08);
            animation: tealEyeBlinkBottom 11s cubic-bezier(0.42, 0, 0.58, 1) infinite;
            animation-delay: 0.2s;
            pointer-events: none;
        `;
        eyeButton.appendChild(topLid);
        eyeButton.appendChild(bottomLid);
        eyeButton.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('tealOrbEye:open'));
        });
        document.body.appendChild(eyeButton);

        let irisOffsetX = 0;
        let irisOffsetY = 0;
        let targetOffsetX = 0;
        let targetOffsetY = 0;
        const smoothFollow = () => {
            irisOffsetX += (targetOffsetX - irisOffsetX) * 0.35;
            irisOffsetY += (targetOffsetY - irisOffsetY) * 0.35;
            eyeIris.style.transform = `translate(${irisOffsetX}px, ${irisOffsetY}px)`;
            requestAnimationFrame(smoothFollow);
        };
        smoothFollow();

        const updateIrisTarget = (clientX, clientY) => {
            const rect = eyeButton.getBoundingClientRect();
            const centerXEye = rect.left + rect.width / 2;
            const centerYEye = rect.top + rect.height / 2;
            const dx = clientX - centerXEye;
            const dy = clientY - centerYEye;
            const distance = Math.min(1, Math.hypot(dx, dy) / 80);
            const maxOffset = 14;
            targetOffsetX = (dx / (Math.abs(dx) + Math.abs(dy) + 1)) * maxOffset * distance;
            targetOffsetY = (dy / (Math.abs(dx) + Math.abs(dy) + 1)) * maxOffset * distance;
        };
        document.addEventListener('mousemove', (evt) => updateIrisTarget(evt.clientX, evt.clientY));
        document.addEventListener('touchmove', (evt) => {
            if (evt.touches && evt.touches[0]) {
                updateIrisTarget(evt.touches[0].clientX, evt.touches[0].clientY);
            }
        }, { passive: true });

        const eyeCue = document.createElement('div');
        eyeCue.id = 'teal-eye-cue';
        eyeCue.textContent = 'Click to open GPT';
        Object.assign(eyeCue.style, {
            position: 'fixed',
            top: `${200 + centerY + 70}px`,
            left: `${centerX - 110}px`,
            width: '220px',
            textAlign: 'center',
            fontFamily: '\'Share Tech Mono\', monospace',
            fontSize: '0.9rem',
            fontWeight: '700',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            animation: 'tealEyeCue 4s ease-in-out infinite',
            zIndex: '209'
        });
        eyeCue.style.setProperty('color', '#ffc857', 'important');
        eyeCue.style.setProperty('textShadow', '0 0 12px rgba(255,180,66,0.95)', 'important');
        document.body.appendChild(eyeCue);

        document.addEventListener('tealOrbEye:open', () => {
            eyeCue.style.opacity = '0';
        });
        document.addEventListener('tealOrbEye:close', () => {
            eyeCue.style.opacity = '1';
        });

        // Swarmgate-style arc text
        const existingArc = document.getElementById('core-teal-svg');
        if (existingArc) existingArc.remove();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'core-teal-svg');
        svg.setAttribute('width', 520);
        svg.setAttribute('height', 520);
        svg.style.position = 'fixed';
        svg.style.top = '200px';
        svg.style.left = '0px';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '106';
        svg.style.transformOrigin = '50% 50%';

        const arcRadius = orbRadius + 35;
        const arcLength = Math.PI * arcRadius;
        const arcStartX = centerX - arcRadius;
        const arcEndX = centerX + arcRadius;
        const arcY = centerY + 10;
        const arcPath = `M ${arcStartX} ${arcY} A ${arcRadius} ${arcRadius} 0 1 1 ${arcEndX} ${arcY}`;

        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('id', 'core-teal-arc');
        arc.setAttribute('d', arcPath);
        arc.setAttribute('fill', 'none');
        svg.appendChild(arc);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('font-family', 'Impact, Arial Black, sans-serif');
        text.setAttribute('font-size', '20.5');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('letter-spacing', '0.08em');
        text.setAttribute('textLength', `${Math.round(arcLength * 0.9)}`);
        text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('style', 'text-shadow:0 0 10px #ff2222,0 0 22px #ff2222,0 0 2px #ffffff;');
        const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#core-teal-arc');
        textPath.setAttribute('startOffset', '50%');
        textPath.setAttribute('text-anchor', 'middle');
        textPath.textContent = 'powered by btcminergpt.ai';
        text.appendChild(textPath);
        svg.appendChild(text);
        document.body.appendChild(svg);
        spinTargets.push(svg);

        let orbSpinActive = false;
        window.setTealOrbSpin = function(enabled) {
            const nextState = Boolean(enabled);
            if (nextState === orbSpinActive) return;
            orbSpinActive = nextState;
            spinTargets.forEach(el => {
                if (!el) return;
                el.classList.toggle('teal-core-spin', orbSpinActive);
            });
        };

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

        function animate() {
            drawOrb();
            drawParticles();
            requestAnimationFrame(animate);
        }

        animate();
    });
})();
