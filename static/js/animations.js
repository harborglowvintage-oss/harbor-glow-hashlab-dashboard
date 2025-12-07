// Particle Animation System for Background
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.connectionDistance = 150;
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }
    
    update() {
        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        for (let particle of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
            this.ctx.fill();
        }
        
        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(0, 255, 65, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Hashrate Chart Animation
class HashrateChart {
    constructor(canvasId, maxDataPoints = 50) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.maxDataPoints = maxDataPoints;
        this.maxValue = 100;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    addData(value) {
        this.data.push(value);
        if (this.data.length > this.maxDataPoints) {
            this.data.shift();
        }
        this.maxValue = Math.max(this.maxValue, ...this.data) * 1.1;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.data.length < 2) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const stepX = width / (this.maxDataPoints - 1);
        const scaleY = height / this.maxValue;
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = (height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#00ff41';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ff41';
        
        for (let i = 0; i < this.data.length; i++) {
            const x = i * stepX;
            const y = height - (this.data[i] * scaleY);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Draw area fill
        this.ctx.lineTo(width, height);
        this.ctx.lineTo(0, height);
        this.ctx.closePath();
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 255, 65, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 65, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
}

// Number animation utility
function animateNumber(element, target, duration = 500) {
    const start = parseFloat(element.textContent) || 0;
    const diff = target - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (diff * easeProgress);
        
        element.textContent = current.toFixed(target < 10 ? 2 : 1);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Gauge animation utility
function animateGauge(element, percentage, color = null) {
    element.style.width = `${percentage}%`;
    if (color) {
        element.style.background = color;
    }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start particle animation
    const particleSystem = new ParticleSystem('particleCanvas');
    particleSystem.animate();
    
    // Initialize hashrate chart
    window.hashrateChart = new HashrateChart('hashrateChart');
    
    // Add some initial data points for demo
    for (let i = 0; i < 20; i++) {
        window.hashrateChart.addData(80 + Math.random() * 20);
    }
    window.hashrateChart.draw();
});

// Export utilities for use in dashboard.js
window.animateNumber = animateNumber;
window.animateGauge = animateGauge;
