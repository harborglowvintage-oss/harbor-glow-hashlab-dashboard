// Hashrate wave visualization - centered and responsive
(function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'hashrate-waves';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1'; // Behind content but visible
    canvas.style.opacity = '0.5';
    
    document.body.insertBefore(canvas, document.body.firstChild);
    
    // Ensure main content is above the waves
    document.addEventListener('DOMContentLoaded', () => {
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        if (header) header.style.position = 'relative';
        if (main) {
            main.style.position = 'relative';
            main.style.zIndex = '2';
        }
    });
    
    const ctx = canvas.getContext('2d');
    let width, height;
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 250);
    });
    resize();
    
    // Color palette - electric blues and greens
    const colors = [
        'rgba(0, 200, 255, 0.7)',   // Electric blue
        'rgba(0, 255, 200, 0.7)',   // Cyan
        'rgba(50, 255, 150, 0.7)',  // Bright green
        'rgba(100, 200, 255, 0.7)', // Light blue
        'rgba(0, 255, 100, 0.7)',   // Green
        'rgba(0, 150, 255, 0.7)',   // Deep blue
        'rgba(150, 255, 200, 0.7)'  // Pale cyan
    ];
    
    const waves = [];
    let totalMinerCount = 0;
    
    function getWaveYPosition(index, total) {
        // Distribute waves evenly across viewable area, centered vertically
        if (total <= 1) return height / 2;
        const spacing = height / (total + 1);
        return (index + 1) * spacing;
    }
    
    function createWaves() {
        waves.length = 0;
        
        if (!window.latestMinerData) {
            totalMinerCount = 8;
            for (let i = 0; i < 8; i++) {
                const yPos = getWaveYPosition(i, 8);
                waves.push({
                    amplitude: 25 + (i * 3),
                    frequency: 0.004,
                    phase: (i * Math.PI / 4),
                    speed: 0.04 + (i * 0.005),
                    color: colors[i % colors.length],
                    hashrate: 0,
                    yPosition: yPos,
                    secondaryPhase: (i * Math.PI / 3.5),
                    index: i,
                    name: ''
                });
            }
        } else {
            const miners = Object.values(window.latestMinerData);
            totalMinerCount = miners.length;
            miners.forEach((miner, i) => {
                const hashrate = miner.hashrate_1m || 0;
                const yPos = getWaveYPosition(i, miners.length);
                waves.push({
                    amplitude: 20 + (hashrate * 2.5),
                    frequency: 0.004,
                    phase: (i * Math.PI / 4),
                    speed: 0.035 + (hashrate * 0.002),
                    color: colors[i % colors.length],
                    hashrate: hashrate,
                    name: miner.name || '',
                    yPosition: yPos,
                    secondaryPhase: (i * Math.PI / 3.5),
                    index: i
                });
            });
        }
    }
    
    function drawWave(wave, time) {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 15;
        
        // Draw wave from left to right
        for (let x = 0; x <= width; x += 3) {
            const baseY = wave.yPosition;
            
            // Primary wave
            const primaryOscillation = Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude;
            
            // Secondary wave for more organic flow
            const secondaryOscillation = Math.sin(x * wave.frequency * 1.7 - time * wave.speed * 0.7 + wave.secondaryPhase) * (wave.amplitude * 0.3);
            
            // Combine for flowing effect
            const y = baseY + primaryOscillation + secondaryOscillation;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Add glow effect
        ctx.strokeStyle = wave.color.replace('0.7', '0.3');
        ctx.lineWidth = 6;
        ctx.stroke();
    }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Add glow effect
        ctx.strokeStyle = wave.color.replace('0.7', '0.3');
        ctx.lineWidth = 6;
        ctx.stroke();
    }
    
    let lastMinerCount = 0;
    
    function animate() {
        if (window.latestMinerData) {
            const currentCount = Object.keys(window.latestMinerData).length;
            if (currentCount !== lastMinerCount) {
                createWaves();
                lastMinerCount = currentCount;
            }
            
            const miners = Object.values(window.latestMinerData);
            waves.forEach((wave, i) => {
                if (miners[i]) {
                    const hashrate = miners[i].hashrate_1m || 0;
                    wave.amplitude = 20 + (hashrate * 2.5);
                    wave.speed = 0.035 + (hashrate * 0.002);
                    wave.name = miners[i].name || '';
                    // Update Y position for dynamic miner count
                    wave.yPosition = getWaveYPosition(i, miners.length);
                }
            });
        } else if (waves.length === 0) {
            createWaves();
        }
        
        ctx.clearRect(0, 0, width, height);
        
        const time = Date.now() * 0.001;
        
        waves.forEach(wave => drawWave(wave, time));
        
        requestAnimationFrame(animate);
    }
    
    setTimeout(() => {
        createWaves();
        animate();
    }, 1000);
})();
