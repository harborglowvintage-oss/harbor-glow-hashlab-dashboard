// Add-miner-panel transparency toggle
window.addEventListener('DOMContentLoaded', () => {
  const panel = document.querySelector('.add-miner-panel');
  if (panel) {
    panel.addEventListener('click', () => panel.classList.add('active'));
    panel.addEventListener('focusin', () => panel.classList.add('active'));
    panel.addEventListener('focusout', () => panel.classList.remove('active'));
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) {
        panel.classList.remove('active');
      }
    });
  }
});
// Micro fan animation for Nixie panel (high-tech style)
function drawNixieFan(canvas, speed = 1) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  let angle = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(angle);
    // Outer ring (circular, metallic)
    let grad = ctx.createRadialGradient(0,0,8,0,0,22);
    grad.addColorStop(0, '#222');
    grad.addColorStop(0.7, '#bbb');
    grad.addColorStop(1, '#fff');
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI*2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fff';
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Blades (12, thin, silver, motion blur)
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((Math.PI/6) * i);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(1, -4, 3, -16, 0, -20);
      ctx.bezierCurveTo(-3, -16, -1, -4, 0, 0);
      ctx.closePath();
      let bladeGrad = ctx.createLinearGradient(0, 0, 0, -20);
      bladeGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
      bladeGrad.addColorStop(0.5, 'rgba(200,200,200,0.32)');
      bladeGrad.addColorStop(1, 'rgba(80,80,80,0.18)');
      ctx.fillStyle = bladeGrad;
      ctx.globalAlpha = 0.55;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#fff';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // Simulate motion blur by overlaying faint white arcs
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI/3) * i + angle*1.5);
      ctx.beginPath();
      ctx.arc(0, 0, 16, -0.18, 0.18);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.13)';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#fff';
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // Hub (metallic)
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI*2);
    ctx.fillStyle = '#bbb';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    angle += 0.22 * speed;
    requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded', function() {
  drawNixieFan(document.getElementById('nixie-fan-left'), 1);
  drawNixieFan(document.getElementById('nixie-fan-right'), 1.2);
  animateNixieVentParticles();
  animateFanSmoke('nixie-fan-smoke-left');
  animateFanSmoke('nixie-fan-smoke-right');
  animateKnightRider('nixie-knightrider-left');
  animateKnightRider('nixie-knightrider-right');
  animateLedBar();
});

// Animated teal LED bar above vent, color changes with power status
function animateLedBar() {
  const bar = document.getElementById('nixie-led-bar');
  if (!bar) return;
  bar.innerHTML = '';
  const dot = document.createElement('div');
  dot.className = 'nixie-led-bar-dot';
  bar.appendChild(dot);
  // Example: get power status (replace with real logic)
  let status = 'normal'; // 'normal', 'low', 'critical'
  if (window.nixiePowerStatus) status = window.nixiePowerStatus;
  if (status === 'low') dot.classList.add('orange');
  if (status === 'critical') dot.classList.add('red');
}

// Smoke/steam from both fans
function animateFanSmoke(smokeId) {
  const smokeDiv = document.getElementById(smokeId);
  if (!smokeDiv) return;
  smokeDiv.innerHTML = '';
  // Emit smoke in a full circle, more intense
  const puffCount = 16;
  for (let i = 0; i < puffCount; i++) {
    const puff = document.createElement('div');
    puff.className = 'nixie-fan-smoke-puff';
    // Position in a circle
    const angle = (2 * Math.PI * i) / puffCount;
    const radius = 18 + Math.random() * 4;
    puff.style.left = (50 + Math.cos(angle) * radius) + '%';
    puff.style.bottom = (24 + Math.sin(angle) * radius) + 'px';
    puff.style.animationDelay = (Math.random()*1.2) + 's';
    puff.style.opacity = 0.7 + Math.random() * 0.3;
    smokeDiv.appendChild(puff);
  }
}

// Knight Rider light bar animation
function animateKnightRider(barId) {
  const barDiv = document.getElementById(barId);
  if (!barDiv) return;
  barDiv.innerHTML = '';
  const bar = document.createElement('div');
  bar.className = 'nixie-knightrider-bar';
  barDiv.appendChild(bar);
  // Force reflow to restart animation if needed
  void bar.offsetWidth;
  bar.style.animation = 'nixie-knightrider-move 1.6s linear infinite alternate';
}

// Multi-layered animated blue smoke for Nixie panel
function animateNixieSmoke() {
  const smokeDiv = document.getElementById('nixie-smoke');
  if (!smokeDiv) return;
  smokeDiv.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s1 = document.createElement('div');
    s1.className = 'nixie-smoke-puff';
    s1.style.left = (10 + i*10 + Math.random()*10) + '%';
    s1.style.animationDelay = (Math.random()*2) + 's';
    smokeDiv.appendChild(s1);
    // Layer 2
    const s2 = document.createElement('div');
    s2.className = 'nixie-smoke-puff nixie-smoke-layer2';
    s2.style.left = (10 + i*10 + Math.random()*10) + '%';
    s2.style.animationDelay = (Math.random()*2+1) + 's';
    smokeDiv.appendChild(s2);
    // Layer 3
    const s3 = document.createElement('div');
    s3.className = 'nixie-smoke-puff nixie-smoke-layer3';
    s3.style.left = (10 + i*10 + Math.random()*10) + '%';
    s3.style.animationDelay = (Math.random()*2+2) + 's';
    smokeDiv.appendChild(s3);
  }
}

document.addEventListener('DOMContentLoaded', animateNixieSmoke);

// Animated vent particles (blue airflow)
function animateNixieVentParticles() {
  const vent = document.querySelector('.nixie-vent');
  if (!vent) return;
  // Remove old
  let old = vent.querySelector('.nixie-vent-particles');
  if (old) vent.removeChild(old);
  const particleLayer = document.createElement('div');
  particleLayer.className = 'nixie-vent-particles';
  particleLayer.style.position = 'absolute';
  particleLayer.style.left = '0';
  particleLayer.style.top = '0';
  particleLayer.style.width = '100%';
  particleLayer.style.height = '100%';
  particleLayer.style.pointerEvents = 'none';
  vent.appendChild(particleLayer);
  // Create particles
  const count = 10;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'nixie-vent-particle';
    p.style.left = (5 + i * 9) + '%';
    p.style.animationDelay = (Math.random()*2) + 's';
    particleLayer.appendChild(p);
  }
}
