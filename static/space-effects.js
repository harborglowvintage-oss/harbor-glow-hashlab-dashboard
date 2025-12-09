// Space Effects - Twinkling Stars and Random Space Objects
(function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'space-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, 250);
    });
    
    // Stars that twinkle (optimized: 50 instead of 80)
    const stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.4), // Upper 40% for space
            size: Math.random() * 2 + 0.5,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            baseOpacity: Math.random() * 0.5 + 0.3
        });
    }
    
    // Space objects (satellites, ships, UFOs, comets, solar flares, space travelers)
    const spaceObjects = [];

    function createSpaceObject() {
        // Only allow 1-2 easter eggs at a time
        if (spaceObjects.length >= 2) return;
        const types = ['alien-ship', 'space-ship', 'comet', 'solar-flare', 'comet', 'space-traveler', 'mario'];
        let type = types[Math.floor(Math.random() * types.length)];
        // Only allow one solar-flare at a time
        if (type === 'solar-flare' && spaceObjects.some(o => o.type === 'solar-flare')) {
            type = types.filter(t => t !== 'solar-flare')[Math.floor(Math.random() * (types.length - 1))];
        }
        const fromLeft = Math.random() > 0.5;
        let speed = (Math.random() * 1.2 + 0.8) * (fromLeft ? 1 : -1);
        let size = Math.random() * 20 + 15;
        let maxAge = width + 100;
        let transparency = 0.7 + Math.random() * 0.3;
        if (type === 'solar-flare') {
            maxAge = 100; // ~10 seconds at 60fps
            speed = (Math.random() * 0.5 + 0.5) * (fromLeft ? 1 : -1); // slower
            transparency = 0.5 + Math.random() * 0.5;
        }
        if (type === 'mario') {
            size = 48 + Math.random() * 16;
            speed = (Math.random() * 1.5 + 1.2) * (fromLeft ? 1 : -1);
            maxAge = width + 100;
        }
        spaceObjects.push({
            type: type,
            x: fromLeft ? -50 : width + 50,
            y: Math.random() * (height * 0.35),
            speed: speed,
            size: size,
            rotation: 0,
            rotationSpeed: Math.random() * 0.02 - 0.01,
            blinkPhase: 0,
            age: 0,
            maxAge: maxAge,
            fromLeft: fromLeft,
            trailParticles: [],
            transparency: transparency,
            flashes: type === 'solar-flare' ? 0 : undefined
        });
    }
    
    // Create first object and schedule random ones every ~5 minutes
    setTimeout(createSpaceObject, Math.random() * 10000);
    
    function scheduleNextObject() {
        setTimeout(() => {
            createSpaceObject();
            scheduleNextObject();
        }, 300000); // 5 minutes
    }
    scheduleNextObject();
    
    function drawAlienShip(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        if (!obj.fromLeft) ctx.scale(-1, 1);
        
        // Classic flying saucer
        const gradient = ctx.createRadialGradient(0, -5, 0, 0, -5, 15);
        gradient.addColorStop(0, 'rgba(150, 255, 150, 0.9)');
        gradient.addColorStop(1, 'rgba(50, 200, 50, 0.3)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, -8, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing lights
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + obj.blinkPhase;
            const x = Math.cos(angle) * 16;
            const y = Math.sin(angle) * 5;
            const brightness = Math.sin(obj.blinkPhase * 2 + i) * 0.5 + 0.5;
            
            ctx.fillStyle = `rgba(0, 255, 200, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function drawSpaceShip(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        if (!obj.fromLeft) ctx.scale(-1, 1);
        ctx.rotate(obj.rotation * 0.1);
        
        // Sleek spaceship body
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(18, -5);
        ctx.lineTo(18, 5);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(5, -12);
        ctx.lineTo(10, -5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(5, 12);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(obj.blinkPhase) * 0.3})`;
        ctx.beginPath();
        ctx.arc(10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Engine thrust
        const thrust = Math.sin(obj.blinkPhase * 5) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 100, 0, ${thrust})`;
        ctx.beginPath();
        ctx.moveTo(-15, -3);
        ctx.lineTo(-22, -4);
        ctx.lineTo(-22, 4);
        ctx.lineTo(-15, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawComet(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        
        // Comet tail
        const tailLength = 80;
        const gradient = ctx.createLinearGradient(0, 0, obj.fromLeft ? -tailLength : tailLength, 0);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(obj.fromLeft ? -tailLength : tailLength, -8);
        ctx.lineTo(obj.fromLeft ? -tailLength : tailLength, 8);
        ctx.closePath();
        ctx.fill();
        
        // Comet head
        const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
        headGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        headGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.8)');
        headGradient.addColorStop(1, 'rgba(255, 150, 50, 0.3)');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawSolarFlare(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        // Pulsing energy core
        const pulseSize = obj.size * (1 + Math.sin(obj.blinkPhase * 3) * 0.4);
        // Flash logic: only show for 10 seconds, flash 3x
        let flashOn = false;
        if (typeof obj.flashes !== 'undefined') {
            if (obj.age % 30 === 0 && obj.flashes < 3) {
                obj.flashes++;
                flashOn = true;
            } else if (obj.flashes < 3) {
                flashOn = obj.age % 30 < 10;
            }
        } else {
            flashOn = true;
        }
        if (flashOn) {
            // Outer glow
            const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize * 2);
            outerGlow.addColorStop(0, `rgba(255, 200, 0, ${obj.transparency})`);
            outerGlow.addColorStop(0.4, `rgba(255, 100, 0, ${obj.transparency * 0.5})`);
            outerGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize * 2, 0, Math.PI * 2);
            ctx.fill();
            // Core
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGradient.addColorStop(0.5, `rgba(255, 200, 0, ${obj.transparency})`);
            coreGradient.addColorStop(1, `rgba(255, 100, 0, ${obj.transparency * 0.5})`);
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            // Flare spikes
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + obj.blinkPhase;
                const length = pulseSize * 1.5;
                ctx.strokeStyle = `rgba(255, 200, 0, ${obj.transparency * (0.6 + Math.sin(obj.blinkPhase * 2 + i) * 0.4)})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    
    function drawSpaceTraveler(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        if (!obj.fromLeft) ctx.scale(-1, 1);
        
        // Astronaut suit body
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet with visor
        const helmetGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, 6);
        helmetGradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        helmetGradient.addColorStop(1, 'rgba(50, 150, 255, 0.3)');
        ctx.fillStyle = helmetGradient;
        ctx.beginPath();
        ctx.arc(0, -4, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Arms
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-10 + Math.sin(obj.blinkPhase * 2) * 3, 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(10 + Math.sin(obj.blinkPhase * 2 + Math.PI) * 3, 8);
        ctx.stroke();
        
        // Legs
        ctx.beginPath();
        ctx.moveTo(-2, 8);
        ctx.lineTo(-4, 15 + Math.sin(obj.blinkPhase * 3) * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(2, 8);
        ctx.lineTo(4, 15 + Math.sin(obj.blinkPhase * 3 + Math.PI) * 2);
        ctx.stroke();
        
        // Jetpack thrust
        if (Math.sin(obj.blinkPhase * 4) > 0) {
            ctx.fillStyle = `rgba(100, 200, 255, 0.6)`;
            ctx.beginPath();
            ctx.arc(-8, 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function drawSatellite(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);
        
        // Body
        ctx.fillStyle = '#888';
        ctx.fillRect(-8, -3, 16, 6);
        
        // Solar panels
        ctx.fillStyle = `rgba(0, 100, 200, ${0.7 + Math.sin(obj.blinkPhase) * 0.3})`;
        ctx.fillRect(-15, -8, 5, 16);
        ctx.fillRect(10, -8, 5, 16);
        
        // Antenna
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(0, -10);
        ctx.stroke();
        
        // Blinking light
        if (Math.sin(obj.blinkPhase * 3) > 0.5) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function drawShip(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation * 0.1);
        
        // Hull
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, -4);
        ctx.lineTo(12, 4);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(obj.blinkPhase) * 0.3})`;
        ctx.beginPath();
        ctx.arc(8, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Engines
        const thrust = Math.sin(obj.blinkPhase * 4) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 150, 0, ${thrust})`;
        ctx.beginPath();
        ctx.moveTo(-12, -2);
        ctx.lineTo(-18, -3);
        ctx.lineTo(-18, 3);
        ctx.lineTo(-12, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawUFO(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        
        // Dome
        const gradient = ctx.createRadialGradient(0, -5, 0, 0, -5, 8);
        gradient.addColorStop(0, 'rgba(100, 255, 100, 0.6)');
        gradient.addColorStop(1, 'rgba(50, 200, 50, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Saucer body
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Lights around edge
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + obj.rotation;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 4;
            const brightness = Math.sin(obj.blinkPhase * 2 + i) * 0.5 + 0.5;
            
            ctx.fillStyle = `rgba(255, 255, 0, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Beam (occasionally)
        if (Math.sin(obj.blinkPhase * 0.5) > 0.7) {
            ctx.fillStyle = 'rgba(150, 255, 150, 0.1)';
            ctx.beginPath();
            ctx.moveTo(-5, 5);
            ctx.lineTo(-15, height - obj.y);
            ctx.lineTo(15, height - obj.y);
            ctx.lineTo(5, 5);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    const marioColors = {
        hat: '#d32d2d',
        face: '#f7c59f',
        shirt: '#d32d2d',
        overalls: '#2d3dd3',
        gloves: '#fff',
        shoes: '#7a4b13',
        mustache: '#3a2a1a',
        eyes: '#222',
        buttons: '#ffe066'
    };

    function drawMario(obj) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        if (!obj.fromLeft) ctx.scale(-1, 1);
        ctx.scale(obj.size / 32, obj.size / 32); // Mario is 32px tall
        // Hat
        ctx.fillStyle = marioColors.hat;
        ctx.fillRect(8, 2, 16, 6);
        ctx.fillRect(10, 0, 12, 4);
        // Face
        ctx.fillStyle = marioColors.face;
        ctx.fillRect(10, 8, 12, 8);
        ctx.fillRect(12, 16, 8, 4);
        // Mustache
        ctx.fillStyle = marioColors.mustache;
        ctx.fillRect(12, 14, 8, 2);
        // Eyes
        ctx.fillStyle = marioColors.eyes;
        ctx.fillRect(13, 11, 2, 2);
        ctx.fillRect(17, 11, 2, 2);
        // Shirt
        ctx.fillStyle = marioColors.shirt;
        ctx.fillRect(8, 20, 16, 6);
        // Overalls
        ctx.fillStyle = marioColors.overalls;
        ctx.fillRect(8, 26, 6, 10);
        ctx.fillRect(18, 26, 6, 10);
        ctx.fillRect(12, 26, 8, 6);
        // Buttons
        ctx.fillStyle = marioColors.buttons;
        ctx.fillRect(10, 28, 2, 2);
        ctx.fillRect(20, 28, 2, 2);
        // Gloves
        ctx.fillStyle = marioColors.gloves;
        ctx.fillRect(6, 24, 4, 4);
        ctx.fillRect(22, 24, 4, 4);
        // Shoes
        ctx.fillStyle = marioColors.shoes;
        ctx.fillRect(8, 36, 6, 4);
        ctx.fillRect(18, 36, 6, 4);
        ctx.restore();
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw and update stars
        stars.forEach(star => {
            star.brightness += star.twinkleSpeed;
            const opacity = star.baseOpacity + Math.sin(star.brightness) * 0.4;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Occasional sparkle
            if (Math.random() < 0.001) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(star.x - star.size * 3, star.y);
                ctx.lineTo(star.x + star.size * 3, star.y);
                ctx.moveTo(star.x, star.y - star.size * 3);
                ctx.lineTo(star.x, star.y + star.size * 3);
                ctx.stroke();
            }
        });
        
        // Draw and update space objects
        for (let i = spaceObjects.length - 1; i >= 0; i--) {
            const obj = spaceObjects[i];
            obj.x += obj.speed;
            obj.rotation += obj.rotationSpeed;
            obj.blinkPhase += 0.1;
            obj.age++;
            
            // Draw based on type
            if (obj.type === 'alien-ship') drawAlienShip(obj);
            else if (obj.type === 'space-ship') drawSpaceShip(obj);
            else if (obj.type === 'comet') drawComet(obj);
            else if (obj.type === 'solar-flare') drawSolarFlare(obj);
            else if (obj.type === 'space-traveler') drawSpaceTraveler(obj);
            else if (obj.type === 'satellite') drawSatellite(obj);
            else if (obj.type === 'ship') drawShip(obj);
            else if (obj.type === 'ufo') drawUFO(obj);
            else if (obj.type === 'mario') drawMario(obj);
            
            // Remove if off screen
            const offScreen = obj.fromLeft ? obj.x > width + 100 : obj.x < -100;
            if (obj.age > obj.maxAge || offScreen) {
                spaceObjects.splice(i, 1);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
})();
