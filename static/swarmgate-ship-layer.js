// Swarmgate Ship Animation Layer
// Classy ships fly in/out of the portal, go light speed, and disappear
(function() {
    const container = document.body;
    let canvas = document.getElementById('swarmgate-ship-layer');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'swarmgate-ship-layer';
        canvas.style.position = 'fixed';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '130';
        container.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Portal center (match orb position)
    function getPortalCenter() {
        const orbRect = document.getElementById('miner-portal-orb-container').getBoundingClientRect();
        return {
            x: orbRect.left + orbRect.width/2,
            y: orbRect.top + orbRect.height/2
        };
    }

    // Ship state
    let ship = null;
    let lastAction = 0;
    function spawnShip() {
        const portal = getPortalCenter();
        // Randomly decide entry or exit
        const enter = Math.random() < 0.5;
        // Entry: start offscreen, fly to portal, then light speed to center
        // Exit: start at portal, light speed to offscreen
        let angle, start, end;
        if (enter) {
            angle = Math.random() * Math.PI * 2;
            start = {
                x: portal.x + Math.cos(angle) * (W+H)/2,
                y: portal.y + Math.sin(angle) * (W+H)/2
            };
            end = { x: portal.x, y: portal.y };
        } else {
            angle = Math.random() * Math.PI * 2;
            start = { x: portal.x, y: portal.y };
            end = {
                x: portal.x + Math.cos(angle) * (W+H)/2,
                y: portal.y + Math.sin(angle) * (W+H)/2
            };
        }
        ship = {
            enter,
            angle,
            start,
            end,
            x: start.x,
            y: start.y,
            phase: 'fly', // 'fly' or 'warp'
            t: 0,
            speed: 0.012 + Math.random()*0.008,
            warpSpeed: 0.18 + Math.random()*0.08,
            size: 22 + Math.random()*16,
            color: '#fff',
            accent: ['#00eaff','#ff2222','#ffe600','#fff'][Math.floor(Math.random()*4)]
        };
    }
    function drawShip(s) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        // Fade out as ship approaches center (entry warp)
        let fade = 1.0;
        if (s.phase === 'warp' && s.enter) {
            fade = Math.max(0, 1.0 - s.t);
        }
        ctx.globalAlpha = 0.96 * fade;
        ctx.shadowColor = s.accent;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(-s.size*0.6, 0);
        ctx.lineTo(-s.size*0.2, -s.size*0.22);
        ctx.lineTo(s.size*0.2, -s.size*0.22);
        ctx.lineTo(s.size*0.6, 0);
        ctx.lineTo(s.size*0.2, s.size*0.22);
        ctx.lineTo(-s.size*0.2, s.size*0.22);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        // Cockpit
        ctx.globalAlpha = 0.85 * fade;
        ctx.beginPath();
        ctx.ellipse(0, -s.size*0.09, s.size*0.18, s.size*0.13, 0, 0, Math.PI*2);
        ctx.fillStyle = s.accent;
        ctx.shadowBlur = 8;
        ctx.fill();
        // Engine glow
        ctx.globalAlpha = 0.7 * fade;
        ctx.beginPath();
        ctx.arc(-s.size*0.55, 0, s.size*0.13, 0, Math.PI*2);
        ctx.arc(s.size*0.55, 0, s.size*0.13, 0, Math.PI*2);
        ctx.fillStyle = s.accent;
        ctx.shadowBlur = 16;
        ctx.fill();
        // Animated accent lights
        for (let i=-1; i<=1; i+=2) {
            ctx.save();
            ctx.globalAlpha = (0.6 + 0.3*Math.sin(Date.now()/400 + i*2)) * fade;
            ctx.beginPath();
            ctx.arc(i*s.size*0.32, s.size*0.18, s.size*0.07, 0, Math.PI*2);
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
        }
        // Light speed effect (warp)
        if (s.phase === 'warp') {
            ctx.globalAlpha = 0.5 * fade;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -W/6);
            ctx.stroke();
            // Engine trail
            for (let i=-1; i<=1; i+=2) {
                ctx.save();
                ctx.globalAlpha = 0.3 * fade;
                ctx.strokeStyle = s.accent;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(i*s.size*0.55, 0);
                ctx.lineTo(i*s.size*0.55, s.size*0.7);
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }
    function animate() {
        ctx.clearRect(0,0,W,H);
        // Animate ship
        if (!ship && Date.now()-lastAction > 1200) {
            spawnShip();
            lastAction = Date.now();
        }
        if (ship) {
            if (ship.phase === 'fly') {
                // Move toward portal
                ship.t += ship.speed;
                ship.x = ship.start.x + (ship.end.x-ship.start.x)*ship.t;
                ship.y = ship.start.y + (ship.end.y-ship.start.y)*ship.t;
                if (ship.t >= 1) {
                    ship.phase = 'warp';
                    ship.t = 0;
                }
            } else if (ship.phase === 'warp') {
                // Warp to center (entry) or offscreen (exit)
                ship.t += ship.warpSpeed;
                if (ship.enter) {
                    // Entry: warp to center of page
                    let center = {x: W/2, y: H/2};
                    ship.x = ship.end.x + (center.x-ship.end.x)*ship.t;
                    ship.y = ship.end.y + (center.y-ship.end.y)*ship.t;
                    if (ship.t >= 1) {
                        ship = null;
                        lastAction = Date.now();
                    }
                } else {
                    // Exit: warp offscreen
                    ship.x = ship.start.x + (ship.end.x-ship.start.x)*ship.t;
                    ship.y = ship.start.y + (ship.end.y-ship.start.y)*ship.t;
                    if (ship.t >= 1) {
                        ship = null;
                        lastAction = Date.now();
                    }
                }
            }
            drawShip(ship);
        }
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
    });
})();
