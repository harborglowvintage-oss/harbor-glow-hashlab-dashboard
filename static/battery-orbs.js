// EcoFlow Delta 3 Battery Orbs (Green)
document.addEventListener('DOMContentLoaded', function() {
    const batteries = [
        {
            id: 'battery-orb-1',
            ip: '192.168.179.244',
            mac: '98:a3:16:93:cb:ec',
            position: { top: '20px', right: '230px' },
            label: 'DELTA 3 #1'
        },
        {
            id: 'battery-orb-2',
            ip: '192.168.179.239',
            mac: '98:a3:16:94:01:a4',
            position: { top: '180px', right: '230px' },
            label: 'DELTA 3 #2'
        }
    ];

    batteries.forEach(battery => {
        // Create container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = battery.position.top;
        container.style.right = battery.position.right;
        container.style.width = '140px';
        container.style.height = '140px';
        container.style.zIndex = '100';
        container.style.pointerEvents = 'auto';
        document.body.appendChild(container);

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = battery.id;
        canvas.width = 140;
        canvas.height = 140;
        canvas.style.width = '140px';
        canvas.style.height = '140px';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);

        // Create clickable link overlay
        const link = document.createElement('a');
        link.href = `https://www.ecoflow.com/us/login`;
        link.target = '_blank';
        link.style.position = 'absolute';
        link.style.top = '30px';
        link.style.left = '30px';
        link.style.right = '30px';
        link.style.bottom = '30px';
        link.style.borderRadius = '50%';
        link.style.display = 'flex';
        link.style.alignItems = 'center';
        link.style.justifyContent = 'center';
        link.style.textDecoration = 'none';
        link.style.fontSize = '0.6rem';
        link.style.color = '#fff';
        link.style.textAlign = 'center';
        link.style.fontFamily = "'Share Tech Mono', 'Orbitron', monospace";
        link.style.textShadow = '0 0 8px rgba(100, 255, 150, 0.8), 0 0 14px rgba(50, 255, 100, 0.6)';
        link.style.letterSpacing = '0.1em';
        link.style.textTransform = 'uppercase';
        link.style.border = '1px solid rgba(100, 255, 150, 0.3)';
        link.style.boxShadow = '0 0 20px rgba(100, 255, 150, 0.4)';
        link.style.backdropFilter = 'blur(4px)';
        link.style.transition = 'all 0.3s ease';
        link.innerHTML = battery.label;
        
        link.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 30px rgba(100, 255, 150, 0.8)';
            this.style.transform = 'scale(1.05)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 0 20px rgba(100, 255, 150, 0.4)';
            this.style.transform = 'scale(1)';
        });
        
        container.appendChild(link);

        // Add label below orb
        const labelDiv = document.createElement('div');
        labelDiv.style.position = 'absolute';
        labelDiv.style.top = '145px';
        labelDiv.style.left = '0';
        labelDiv.style.width = '140px';
        labelDiv.style.textAlign = 'center';
        labelDiv.style.fontFamily = "'Share Tech Mono', 'Orbitron', monospace";
        labelDiv.style.fontSize = '0.65rem';
        labelDiv.style.color = '#a0ffcc';
        labelDiv.style.letterSpacing = '0.08em';
        labelDiv.style.textShadow = '0 0 10px rgba(100, 255, 150, 0.5)';
        labelDiv.innerHTML = `<span style="display:block;">BATTERY</span><span style="display:block;margin-top:2px;">OFFLINE</span>`;
        container.appendChild(labelDiv);

        // Animation
        const ctx = canvas.getContext('2d');
        const centerX = 70;
        const centerY = 70;
        const orbRadius = 35;
        let time = 0;

        // Create orbiting energy particles
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                angle: (Math.PI * 2 * i) / particleCount,
                speed: 0.02 + Math.random() * 0.01,
                distance: 50 + Math.random() * 15,
                size: 2 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.02;

            // Outer glow
            const outerGlow = ctx.createRadialGradient(centerX, centerY, orbRadius * 0.5, centerX, centerY, orbRadius * 2);
            outerGlow.addColorStop(0, 'rgba(100, 255, 150, 0.4)');
            outerGlow.addColorStop(0.5, 'rgba(50, 255, 100, 0.2)');
            outerGlow.addColorStop(1, 'rgba(0, 200, 100, 0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core gradient
            const coreGradient = ctx.createRadialGradient(
                centerX - orbRadius * 0.3,
                centerY - orbRadius * 0.3,
                orbRadius * 0.1,
                centerX,
                centerY,
                orbRadius
            );
            coreGradient.addColorStop(0, 'rgba(200, 255, 220, 0.9)');
            coreGradient.addColorStop(0.4, 'rgba(100, 255, 150, 0.7)');
            coreGradient.addColorStop(0.7, 'rgba(50, 200, 100, 0.6)');
            coreGradient.addColorStop(1, 'rgba(20, 150, 80, 0.8)');
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow pulse
            const pulseIntensity = 0.3 + Math.sin(time * 2) * 0.2;
            const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius * 0.6);
            innerGlow.addColorStop(0, `rgba(150, 255, 180, ${pulseIntensity})`);
            innerGlow.addColorStop(1, 'rgba(100, 255, 150, 0)');
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Draw orbiting energy particles
            particles.forEach(particle => {
                particle.angle += particle.speed;
                const x = centerX + Math.cos(particle.angle) * particle.distance;
                const y = centerY + Math.sin(particle.angle) * particle.distance;
                
                const brightness = 0.5 + Math.sin(time * 3 + particle.phase) * 0.5;
                
                ctx.fillStyle = `rgba(150, 255, 180, ${brightness})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(100, 255, 150, 0.8)';
                ctx.beginPath();
                ctx.arc(x, y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Lightning arc effect (occasional)
            if (Math.random() < 0.05) {
                const arcAngle = Math.random() * Math.PI * 2;
                const arcDist = orbRadius * 0.8;
                const arcX = centerX + Math.cos(arcAngle) * arcDist;
                const arcY = centerY + Math.sin(arcAngle) * arcDist;
                
                ctx.strokeStyle = `rgba(150, 255, 200, ${0.5 + Math.random() * 0.5})`;
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(100, 255, 150, 1)';
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.quadraticCurveTo(
                    centerX + Math.random() * 20 - 10,
                    centerY + Math.random() * 20 - 10,
                    arcX,
                    arcY
                );
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            requestAnimationFrame(animate);
        }

        animate();
    });
});
