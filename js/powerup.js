class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'spray' or 'nuke'
        this.radius = 15;
        this.active = true;
        this.pulseValue = 0;
        this.pulseDirection = 1;
        
        // Config based on type
        if (this.type === 'spray') {
            this.color = '#ffcc00'; // Gold color for spray gun
            this.duration = 10000; // 10 seconds duration
            this.name = 'SPRAY GUN';
        } else if (this.type === 'nuke') {
            this.color = '#ff4d4d'; // Red color for nuke
            this.duration = null; // Instant effect
            this.name = 'NUKE';
        }
    }

    update(deltaTime) {
        // Create a pulsing effect
        this.pulseValue += this.pulseDirection * 2 * deltaTime;
        
        if (this.pulseValue > 1) {
            this.pulseValue = 1;
            this.pulseDirection = -1;
        } else if (this.pulseValue < 0) {
            this.pulseValue = 0;
            this.pulseDirection = 1;
        }
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x - offsetX;
        const screenY = this.y - offsetY;
        
        // Glowing effect
        const glowSize = this.radius + 5 * this.pulseValue;
        
        // Draw outer glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon based on type
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.type === 'spray') {
            ctx.fillText('S', screenX, screenY);
        } else if (this.type === 'nuke') {
            ctx.fillText('N', screenX, screenY);
        }
    }

    // Apply powerup effect
    apply(game) {
        if (this.type === 'spray') {
            game.player.setWeapon('spray', this.duration);
            showNotification('SPRAY GUN ACTIVATED');
        } else if (this.type === 'nuke') {
            // Clear all zombies and add to score
            const zombieCount = game.zombies.length;
            game.score += zombieCount;
            updateElement('score', game.score);
            updateElement('score-top', game.score);
            
            // Visual effect for nuke
            game.nukeEffect = 1.0; // Start the nuke visual effect
            
            // Clear zombies
            game.zombies = [];
            updateElement('zombies', 0);
            
            showNotification(`NUKE! +${zombieCount} SCORE`);
        }
    }

    static generateRandom(canvasWidth, canvasHeight, offsetX, offsetY) {
        // Determine type with weighted probability (spray more common than nuke)
        const type = Math.random() < 0.3 ? 'spray' : 'nuke';
        
        // Generate position within the visible screen area, plus a margin
        const margin = 100; // Keep power-ups away from screen edges
        
        const x = offsetX + random(margin, canvasWidth - margin);
        const y = offsetY + random(margin, canvasHeight - margin);
        
        return new Powerup(x, y, type);
    }
}
