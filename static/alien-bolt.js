/**
 * ALIEN LIGHTNING BOLT - Rotating around Shares/Rejected/Stale box
 * Orange/Yellow/Red alien energy bolt, 10 seconds per rotation
 * Optimized for performance with minimal calculations
 */

(function() {
    const ROTATION_SPEED = (Math.PI * 2) / (10 * 60); // 10 seconds at 60fps
    const BOLT_DISTANCE = 80; // Distance from center
    const SEGMENT_COUNT = 12; // Bolt segments
    const JITTER_AMOUNT = 4; // Alien energy jitter
    const GLOW_INTENSITY = 20;
    
    let canvas, ctx, centerX, centerY, angle = 0;
    let boltPoints = [];
    let glowPhase = 0;
    
    // Pre-calculate colors for performance
    const colors = [
        'rgba(255, 140, 0, 0.9)',   // Dark orange
        'rgba(255, 200, 0, 0.95)',  // Orange-yellow
        'rgba(255, 255, 0, 1)',     // Yellow
        'rgba(255, 100, 0, 0.85)',  // Red-orange
        'rgba(255, 50, 0, 0.8)'     // Red
    ];
    
    function init() {
        // Wait for shares section to be rendered
        const checkInterval = setInterval(() => {
            const sharesSection = document.querySelector('.shares-section');
            if (sharesSection) {
                clearInterval(checkInterval);
                setupCanvas(sharesSection);
            }
        }, 100);
    }
    
    function setupCanvas(target) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '5';
        
        target.style.position = 'relative';
        target.appendChild(canvas);
        
        ctx = canvas.getContext('2d', { alpha: true });
        updateSize(target);
        
        // Throttled resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => updateSize(target), 250);
        });
        
        generateBoltPath();
        animate();
    }
    
    function updateSize(target) {
        const rect = target.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
    }
    
    function generateBoltPath() {
        boltPoints = [];
        const baseLength = 60;
        
        for (let i = 0; i < SEGMENT_COUNT; i++) {
            const t = i / SEGMENT_COUNT;
            // Alien zigzag pattern
            const zigzag = (i % 2) ? -8 : 8;
            boltPoints.push({
                offset: t * baseLength,
                perpendicular: zigzag + (Math.random() - 0.5) * 3,
                jitterX: 0,
                jitterY: 0
            });
        }
    }
    
    function drawAlienBolt() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate bolt position
        const boltX = centerX + Math.cos(angle) * BOLT_DISTANCE;
        const boltY = centerY + Math.sin(angle) * BOLT_DISTANCE;
        
        // Bolt direction (tangent to circle)
        const dirX = -Math.sin(angle);
        const dirY = Math.cos(angle);
        
        // Perpendicular direction
        const perpX = Math.cos(angle);
        const perpY = Math.sin(angle);
        
        // Alien energy glow
        glowPhase += 0.1;
        const glowPulse = 1 + Math.sin(glowPhase) * 0.3;
        
        // Draw glow layers (optimized: only 2 layers)
        for (let g = 1; g >= 0; g--) {
            ctx.save();
            ctx.shadowBlur = GLOW_INTENSITY * (g + 1) * glowPulse;
            ctx.shadowColor = colors[1];
            ctx.strokeStyle = colors[Math.min(g * 2, colors.length - 1)];
            ctx.lineWidth = 3 - g;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            
            for (let i = 0; i < boltPoints.length; i++) {
                const pt = boltPoints[i];
                
                // Update jitter (alien energy instability)
                if (Math.random() < 0.3) {
                    pt.jitterX = (Math.random() - 0.5) * JITTER_AMOUNT;
                    pt.jitterY = (Math.random() - 0.5) * JITTER_AMOUNT;
                }
                
                const x = boltX + dirX * pt.offset + perpX * pt.perpendicular + pt.jitterX;
                const y = boltY + dirY * pt.offset + perpY * pt.perpendicular + pt.jitterY;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.stroke();
            ctx.restore();
        }
        
        // Core energy sphere at bolt origin
        const coreGradient = ctx.createRadialGradient(boltX, boltY, 0, boltX, boltY, 8);
        coreGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        coreGradient.addColorStop(0.5, colors[2]);
        coreGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = colors[2];
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(boltX, boltY, 6 * glowPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Alien tech rings around core
        for (let r = 0; r < 2; r++) {
            ctx.save();
            ctx.strokeStyle = colors[r % colors.length];
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4 + Math.sin(glowPhase + r) * 0.2;
            ctx.beginPath();
            ctx.arc(boltX, boltY, 10 + r * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    function animate() {
        angle += ROTATION_SPEED;
        if (angle > Math.PI * 2) angle -= Math.PI * 2;
        
        drawAlienBolt();
        requestAnimationFrame(animate);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
