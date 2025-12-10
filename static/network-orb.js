// Network Orb with Orbiting Data Particles
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'network-orb-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '20px';
    canvas.style.left = '20px';
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
        // Random angles in 3D space for natural orbits
        const theta = Math.random() * Math.PI * 2; // Horizontal angle
        const phi = Math.random() * Math.PI; // Vertical angle
        
        particles.push({
            theta: theta,
            phi: phi,
            thetaSpeed: (Math.random() - 0.5) * 0.03,
            phiSpeed: (Math.random() - 0.5) * 0.02,
            distance: 70 + Math.random() * 30,
            size: 2 + Math.random() * 3,
            hue: Math.random() * 360, // Random color
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.05 + 0.02
        });
    }
    
    // Data labels floating around the sphere
    const uploadLabel = {
        theta: 0,
        phi: Math.PI / 3,
        distance: 65,
        speed: 0.04, // Good internet speed
        totalMB: 0,
        label: '↑0.0MB'
    };
    
    const downloadLabel = {
        theta: Math.PI,
        phi: Math.PI / 2,
        distance: 70,
        speed: 0.04, // Good internet speed
        totalMB: 0,
        label: '↓0.0MB'
    };
    
    // Simulate data transfer activity
    setInterval(() => {
        // Random upload
        const uploadAmount = Math.random() * 5;
        uploadLabel.totalMB += uploadAmount;
        uploadLabel.label = `↑${uploadLabel.totalMB.toFixed(1)}MB`;
        
        // Increase speed temporarily on activity (good internet)
        uploadLabel.speed = Math.min(0.08, uploadLabel.speed + 0.01);
    }, 1000 + Math.random() * 2000);
    
    setInterval(() => {
        // Random download
        const downloadAmount = Math.random() * 5;
        downloadLabel.totalMB += downloadAmount;
        downloadLabel.label = `↓${downloadLabel.totalMB.toFixed(1)}MB`;
        
        // Increase speed temporarily on activity (good internet)
        downloadLabel.speed = Math.min(0.08, downloadLabel.speed + 0.01);
    }, 1000 + Math.random() * 2000);
    
    function drawOrb() {
        // Outer glow
        const outerGlow = ctx.createRadialGradient(centerX, centerY, orbRadius * 0.5, centerX, centerY, orbRadius * 2);
        outerGlow.addColorStop(0, 'rgba(100, 150, 255, 0.4)');
        outerGlow.addColorStop(0.5, 'rgba(50, 100, 255, 0.2)');
        outerGlow.addColorStop(1, 'rgba(0, 50, 200, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Planet body with gradient
        const planetGradient = ctx.createRadialGradient(
            centerX - orbRadius * 0.3,
            centerY - orbRadius * 0.3,
            orbRadius * 0.1,
            centerX,
            centerY,
            orbRadius
        );
        planetGradient.addColorStop(0, 'rgba(120, 180, 255, 0.9)');
        planetGradient.addColorStop(0.4, 'rgba(70, 130, 255, 0.8)');
        planetGradient.addColorStop(1, 'rgba(30, 80, 200, 0.6)');
        
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Surface detail rings
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 5, orbRadius * 0.8, orbRadius * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shine
        ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - orbRadius * 0.25, centerY - orbRadius * 0.25, orbRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Core pulse
        const time = Date.now() * 0.002;
        const pulseSize = orbRadius * 0.15 * (1 + Math.sin(time) * 0.2);
        const pulseGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
        pulseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        pulseGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
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
            const wobble = Math.sin(particle.phase) * 5;
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
            ctx.lineWidth = 1;
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
    
    function drawDataLabels() {
        // Upload label
        uploadLabel.theta += uploadLabel.speed;
        uploadLabel.speed *= 0.99; // Decay speed (simulating idle/bad internet)
        uploadLabel.speed = Math.max(0.01, uploadLabel.speed); // Min speed for bad internet
        
        const uploadX = centerX + uploadLabel.distance * Math.sin(uploadLabel.phi) * Math.cos(uploadLabel.theta);
        const uploadY = centerY + uploadLabel.distance * Math.sin(uploadLabel.phi) * Math.sin(uploadLabel.theta);
        
        ctx.save();
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Upload shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(uploadLabel.label, uploadX, uploadY);
        
        // Upload text
        ctx.fillStyle = 'rgba(0, 255, 100, 1)';
        ctx.fillText(uploadLabel.label, uploadX, uploadY);
        
        // Download label
        downloadLabel.theta += downloadLabel.speed;
        downloadLabel.speed *= 0.99; // Decay speed (simulating idle/bad internet)
        downloadLabel.speed = Math.max(0.01, downloadLabel.speed); // Min speed for bad internet
        
        const downloadX = centerX + downloadLabel.distance * Math.sin(downloadLabel.phi) * Math.cos(downloadLabel.theta);
        const downloadY = centerY + downloadLabel.distance * Math.sin(downloadLabel.phi) * Math.sin(downloadLabel.theta);
        
        // Download shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(downloadLabel.label, downloadX, downloadY);
        
        // Download text
        ctx.fillStyle = 'rgba(255, 150, 0, 1)';
        ctx.fillText(downloadLabel.label, downloadX, downloadY);
        
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
