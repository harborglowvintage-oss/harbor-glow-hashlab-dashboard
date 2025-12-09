// Background Gold Orb - Far in the distance
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'background-orb-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1'; // Behind everything
    canvas.style.opacity = '0.3'; // Make it look distant
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    const orbRadius = 180; // Much larger orb
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
    });
    
    // Create data particles that orbit in 3D space around the orb
    const particles = [];
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        // Random angles in 3D space for natural orbits
        const theta = Math.random() * Math.PI * 2; // Horizontal angle
        const phi = Math.random() * Math.PI; // Vertical angle
        
        particles.push({
            theta: theta,
            phi: phi,
            thetaSpeed: (Math.random() - 0.5) * 0.03,
            phiSpeed: (Math.random() - 0.5) * 0.02,
            distance: 250 + Math.random() * 100,
            size: 4 + Math.random() * 6,
            hue: 30 + Math.random() * 30, // Orange/Gold hues (30-60)
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.05 + 0.02
        });
    }
    
    function drawOrb() {
        // Outer glow - gold/orange
        const outerGlow = ctx.createRadialGradient(centerX, centerY, orbRadius * 0.5, centerX, centerY, orbRadius * 2.5);
        outerGlow.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
        outerGlow.addColorStop(0.5, 'rgba(255, 150, 0, 0.2)');
        outerGlow.addColorStop(1, 'rgba(200, 100, 0, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Planet body with gold gradient
        const planetGradient = ctx.createRadialGradient(
            centerX - orbRadius * 0.3,
            centerY - orbRadius * 0.3,
            orbRadius * 0.1,
            centerX,
            centerY,
            orbRadius
        );
        planetGradient.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
        planetGradient.addColorStop(0.4, 'rgba(255, 180, 50, 0.8)');
        planetGradient.addColorStop(1, 'rgba(200, 120, 30, 0.6)');
        
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Surface detail rings
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 15, orbRadius * 0.8, orbRadius * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shine
        ctx.fillStyle = 'rgba(255, 250, 200, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - orbRadius * 0.25, centerY - orbRadius * 0.25, orbRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Core pulse
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
            // Update angles for 3D orbital motion
            particle.theta += particle.thetaSpeed;
            particle.phi += particle.phiSpeed;
            particle.phase += particle.wobbleSpeed;
            
            // Convert spherical coordinates to 2D projection
            const wobble = Math.sin(particle.phase) * 8;
            const distance = particle.distance + wobble;
            
            // 3D to 2D projection
            const x = centerX + distance * Math.sin(particle.phi) * Math.cos(particle.theta);
            const y = centerY + distance * Math.sin(particle.phi) * Math.sin(particle.theta);
            const z = distance * Math.cos(particle.phi);
            
            // Calculate depth for size scaling and opacity
            const depthScale = (z + distance) / (distance * 2);
            const actualSize = particle.size * (0.5 + depthScale * 0.5);
            const opacity = 0.3 + depthScale * 0.7;
            
            // Draw connection line to planet
            ctx.strokeStyle = `hsla(${particle.hue}, 80%, 60%, ${opacity * 0.15})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            // Draw particle glow
            const color = `hsla(${particle.hue}, 100%, 60%, ${opacity})`;
            const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, actualSize * 4);
            particleGlow.addColorStop(0, color);
            particleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(x, y, actualSize * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw particle core
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, actualSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add bright center
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
            ctx.beginPath();
            ctx.arc(x, y, actualSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawOrb();
        drawParticles();
        
        requestAnimationFrame(animate);
    }
    
    animate();
});
