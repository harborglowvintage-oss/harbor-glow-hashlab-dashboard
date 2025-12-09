// Full-screen steam layer
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('steam-layer');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const steamParticles = [];
    
    // Get fan positions from h1 element and PSU fan
    let fanLeftX, fanLeftY, fanRightX, fanRightY, psuFanX, psuFanY;
    
    function updateFanPositions() {
        const h1 = document.querySelector('h1');
        if (!h1) return;
        
        const h1Rect = h1.getBoundingClientRect();
        const verticalCenter = h1Rect.top + (h1Rect.height / 2);
        
        // Fans are 60x60, positioned at left: 5px and right: 5px
        fanLeftX = h1Rect.left + 35;  // 5px + (60px / 2) = center of left fan
        fanLeftY = verticalCenter;
        fanRightX = h1Rect.right - 35;  // right edge - 5px - (60px / 2) = center of right fan
        fanRightY = verticalCenter;
        
        // PSU fan position (140x140 canvas in widget)
        const psuWidget = document.querySelector('.psu-fan-widget');
        if (psuWidget) {
            const psuRect = psuWidget.getBoundingClientRect();
            psuFanX = psuRect.left + 70;  // Center of 140px fan
            psuFanY = psuRect.top + 70;
        }
    }
    
    updateFanPositions();
    
    // Periodically update PSU fan position (it may load after initial check)
    setInterval(updateFanPositions, 1000);
    
    // Update on resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateFanPositions();
    });
    
    function createSteamParticle(sourceType = 'left') {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 1;
        
        let x, y, spawnX, spawnY;
        if (sourceType === 'psu' && psuFanX) {
            x = psuFanX;
            y = psuFanY;
            spawnX = psuFanX;
            spawnY = psuFanY;
        } else if (sourceType === 'right' && fanRightX) {
            x = fanRightX;
            y = fanRightY;
            spawnX = fanRightX;
            spawnY = fanRightY;
        } else if (fanLeftX) {
            x = fanLeftX;
            y = fanLeftY;
            spawnX = fanLeftX;
            spawnY = fanLeftY;
        } else {
            return null; // No valid spawn point
        }
        
        return {
            x: x,
            y: y,
            spawnX: spawnX,
            spawnY: spawnY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 5 + 3,
            life: 1,
            decay: Math.random() * 0.01 + 0.008
        };
    }
    
    const MAX_PARTICLES = 700;
    const SPAWN_RATE = 0.50;
    const MAX_FADE_DISTANCE = 300;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Add new particles from all three fans
        if (steamParticles.length < MAX_PARTICLES) {
            if (Math.random() < SPAWN_RATE && fanLeftX) {
                const p = createSteamParticle('left');
                if (p) steamParticles.push(p);
            }
            if (Math.random() < SPAWN_RATE && fanRightX) {
                const p = createSteamParticle('right');
                if (p) steamParticles.push(p);
            }
            if (Math.random() < SPAWN_RATE && psuFanX) {
                const p = createSteamParticle('psu');
                if (p) steamParticles.push(p);
            }
        }
        
        // Update and draw particles
        for (let i = steamParticles.length - 1; i >= 0; i--) {
            const particle = steamParticles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.size *= 1.03;
            
            // Calculate distance from spawn point (use stored spawn position)
            const dx = particle.x - particle.spawnX;
            const dy = particle.y - particle.spawnY;
            const distanceFromSpawn = Math.sqrt(dx * dx + dy * dy);
            
            // Fade based on distance
            const fadeFactor = Math.max(0, 1 - (distanceFromSpawn / MAX_FADE_DISTANCE));
            
            // Remove if faded out or off screen
            if (particle.life <= 0 || fadeFactor <= 0.01 || 
                particle.x < -50 || particle.x > canvas.width + 50 ||
                particle.y < -50 || particle.y > canvas.height + 50) {
                steamParticles.splice(i, 1);
                continue;
            }
            
            // Draw particle with distance-based fade
            ctx.save();
            ctx.globalAlpha = particle.life * fadeFactor * 0.4;
            
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.filter = 'blur(5px)';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
});
