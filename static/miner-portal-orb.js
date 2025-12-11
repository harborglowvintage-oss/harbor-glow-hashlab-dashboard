// Quantum Leap Stargate Portal Orb for Miner Hyperlinks
// Neon purple orb, hyperlinks orbiting as letters, clickable
(function() {
    let minerList = [];
    const linkPalette = ['#00eaff', '#ff8c00', '#9d7bff', '#59ffa1', '#ff5ea8'];
    const linkMeta = new Map();
    function syncMinerList(list) {
        minerList = Array.isArray(list) ? list.filter(Boolean) : [];
        const incoming = new Set(minerList.map(m => m.name));
        Array.from(linkMeta.keys()).forEach(name => {
            if (!incoming.has(name)) linkMeta.delete(name);
        });
        minerList.forEach((miner, idx) => {
            if (!linkMeta.has(miner.name)) {
                linkMeta.set(miner.name, {
                    color: linkPalette[idx % linkPalette.length]
                });
            }
        });
    }
    window.updateSwarmgateLinks = function(list) {
        syncMinerList(list);
    };
    // Orb placement: inside container div
    const orbSize = 140;
    const container = document.getElementById('miner-portal-orb-container');
    // Remove previous SVG logo if present
    const oldLogo = document.getElementById('swarmgate-logo-svg');
    if (oldLogo) oldLogo.remove();
    // Add SVG logo
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'swarmgate-logo-svg');
    svg.setAttribute('width', orbSize+40);
    svg.setAttribute('height', orbSize+40);
    svg.style.position = 'absolute';
    svg.style.left = '20px';
    svg.style.top = '0px';
    svg.style.zIndex = '202';
    svg.style.pointerEvents = 'none';
    // Arc path for text
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('id', 'swarmgate-arc');
    arc.setAttribute('d', `M ${orbSize/2+20-60},${orbSize/2+20} A 60 60 0 1 1 ${orbSize/2+20+60},${orbSize/2+20}`);
    arc.setAttribute('fill', 'none');
    svg.appendChild(arc);
    // TextPath for logo
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('font-family', 'Impact, Arial Black, sans-serif');
    text.setAttribute('font-size', '18');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('letter-spacing', '0.08em');
    text.setAttribute('textLength', '120');
    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('style', 'text-shadow:0 0 10px #ff2222,0 0 22px #ff2222,0 0 2px #fff;');
    const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#swarmgate-arc');
    textPath.setAttribute('startOffset', '50%');
    textPath.textContent = 'SWARMGATE';
    text.appendChild(textPath);
    svg.appendChild(text);
    container.appendChild(svg);

    // Restore orb canvas creation
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = orbSize;
        canvas.height = orbSize;
        canvas.style.position = 'absolute';
        canvas.style.left = '40px';
        canvas.style.top = '20px';
        canvas.style.zIndex = '201';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    // Create orbiting hyperlink letters with color and radius
    syncMinerList(minerList);
    function drawOrb() {
        ctx.clearRect(0, 0, orbSize, orbSize);
        // Teal orb base
        ctx.save();
        ctx.beginPath();
        ctx.arc(orbSize/2, orbSize/2, orbSize/2-12, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,234,255,0.22)';
        ctx.shadowBlur = 36;
        ctx.shadowColor = '#00eaff';
        ctx.fill();
        ctx.restore();
        // Inner teal glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(orbSize/2, orbSize/2, orbSize/2-28, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,234,255,0.33)';
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#00eaff';
        ctx.fill();
        ctx.restore();
        // Multi-layered teal shimmer
        for (let i=0; i<7; i++) {
            ctx.save();
            ctx.globalAlpha = 0.10 + 0.09*Math.sin(Date.now()/500+i*2);
            ctx.beginPath();
            ctx.arc(orbSize/2, orbSize/2, orbSize/2-18-i*6+Math.sin(Date.now()/600+i)*3, 0, Math.PI*2);
            ctx.strokeStyle = '#00eaff';
            ctx.lineWidth = 1.5 + Math.sin(Date.now()/700+i)*0.7;
            ctx.shadowBlur = 10 + i*2;
            ctx.shadowColor = '#fff';
            ctx.stroke();
            ctx.restore();
        }
        // Quantum leap effect: teal energy pulses
        for (let i=0; i<3; i++) {
            ctx.save();
            ctx.globalAlpha = 0.13 + 0.09*Math.cos(Date.now()/800+i*3);
            ctx.beginPath();
            ctx.arc(orbSize/2, orbSize/2, orbSize/2-32-i*10+Math.cos(Date.now()/900+i)*4, 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(0,234,255,0.7)';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00eaff';
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }
    // Render orbiting hyperlink letters
    function renderLinks() {
        // Remove previous link elements
        // Remove previous link elements from container only
        container.querySelectorAll('.miner-portal-link').forEach(e => e.remove());
        const centerX = 40 + orbSize/2;
        const centerY = 20 + orbSize/2;
        // Evenly space links around the circle with subtle synchronized motion
        const totalLinks = minerList.length;
        if (!totalLinks) return;
        for (let i=0; i<totalLinks; i++) {
            const miner = minerList[i];
            const meta = linkMeta.get(miner.name) || { color: linkPalette[0] };
            const baseAngle = (2 * Math.PI * i) / totalLinks;
            const wobble = 0.03 * Math.sin(Date.now()/3200 + i);
            const radius = (orbSize/2) + 18 + 4 * Math.sin(Date.now()/2500 + i);
            const angle = baseAngle + wobble;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            let link = document.createElement('a');
            link.className = 'miner-portal-link';
            if (miner.ip) {
                link.href = `http://${miner.ip}/`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else {
                link.href = '#';
                link.style.pointerEvents = 'none';
            }
            link.textContent = miner.name === 'NerdAxe1'
                ? 'Nq'
                : miner.name === 'H-nerd'
                    ? 'Hn'
                    : miner.name[0] || '?';
            link.style.position = 'absolute';
            link.style.left = (x-15) + 'px';
            link.style.top = (y-15) + 'px';
            link.style.width = '30px';
            link.style.height = '30px';
            link.style.display = 'flex';
            link.style.alignItems = 'center';
            link.style.justifyContent = 'center';
            link.style.fontFamily = 'Share Tech Mono, monospace';
            link.style.fontWeight = 'bold';
            link.style.fontSize = '1.3em';
            link.style.color = '#00eaff';
            link.style.background = 'rgba(0,234,255,0.18)';
            link.style.borderRadius = '50%';
            link.style.boxShadow = `0 0 12px ${meta.color}, 0 0 4px #fff`;
            link.style.textShadow = `0 0 8px ${meta.color}, 0 0 2px #fff`;
            link.style.zIndex = '201';
            link.style.pointerEvents = miner.ip ? 'auto' : 'none';
            link.style.transition = 'background 0.2s, color 0.2s';
            link.style.textDecoration = 'none';
            link.onmouseover = () => {
                link.style.background = '#fff';
                link.style.color = '#8000ff';
            };
            link.onmouseout = () => {
                link.style.background = 'rgba(128,0,255,0.33)';
                link.style.color = meta.color;
            };
            container.appendChild(link);
        }
    }
    function animate() {
        drawOrb();
        renderLinks();
        requestAnimationFrame(animate);
    }
    animate();
})();
