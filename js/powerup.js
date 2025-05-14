class Powerup {
    // Static properties to hold sprite images
    static sprites = {
        'nuke': 'assets/upgrades/nuke.png',
        'spray': 'assets/upgrades/spray.png',
        'speed': 'assets/upgrades/speed.png',
        'shield': 'assets/upgrades/shield.png'
        // Add other powerup images here if needed in the future
    };
    
    static images = {};
    
    // Static initialization to load images
    static initSprites() {
        // Only load once
        if (Object.keys(this.images).length === 0) {
            // Load each sprite
            for (const [type, src] of Object.entries(this.sprites)) {
                const img = new Image();
                
                img.onload = () => {
                    console.log(`${type} powerup sprite loaded successfully`);
                };
                
                img.onerror = () => {
                    console.error(`Failed to load ${type} powerup sprite: ${src}`);
                };
                
                img.src = src;
                this.images[type] = img;
            }
            
            console.log("Powerup sprites initialized");
        }
    }

    constructor(x, y, type) {
        // Ensure sprites are loaded
        Powerup.initSprites();
        
        this.x = x;
        this.y = y;
        this.type = type; // 'spray', 'nuke', 'shield', 'speed', 'regeneration'
        this.radius = 15;
        this.active = true;
        this.pulseValue = 0;
        this.pulseDirection = 1;
        
        // Config based on type
        switch(this.type) {
            case 'spray':
                this.color = '#ffcc00'; // Gold color for spray gun
                this.duration = 10000; // 10 seconds duration
                this.name = 'SPRAY GUN';
                break;
            case 'nuke':
                this.color = '#ff4d4d'; // Red color for nuke
                this.duration = null; // Instant effect
                this.name = 'NUKE';
                break;
            case 'shield':
                this.color = '#3498db'; // Blue color for shield
                this.duration = 15000; // 15 seconds duration
                this.name = 'SHIELD';
                break;
            case 'speed':
                this.color = '#1abc9c'; // Turquoise color for speed
                this.duration = 12000; // 12 seconds duration
                this.name = 'SPEED BOOST';
                break;
            case 'regeneration':
                this.color = '#2ecc71'; // Green color for regeneration
                this.duration = 8000; // 8 seconds duration
                this.name = 'REGENERATION';
                break;
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
        
        // Check if we should use an image for this powerup type
        if (Powerup.images[this.type] && Powerup.images[this.type].complete) {
            
            // Draw glowing effect behind image
            const glowSize = this.radius + 5 * this.pulseValue;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw color circle behind image for added effect
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius * 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            
            // Draw the powerup image
            const imageSize = this.radius * 2.5;
            ctx.drawImage(
                Powerup.images[this.type],
                screenX - imageSize/2,
                screenY - imageSize/2,
                imageSize,
                imageSize
            );
            
            return;
        }
        
        // For other powerups or if image isn't loaded, use original drawing code
        
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
        
        let icon = '';
        switch(this.type) {
            case 'spray': icon = 'S'; break;
            case 'nuke': icon = 'N'; break;
            case 'shield': icon = 'D'; break;
            case 'speed': icon = '+'; break;
            case 'regeneration': icon = 'R'; break;
        }
        
        ctx.fillText(icon, screenX, screenY);
    }

    // Apply powerup effect
    apply(game) {
        switch(this.type) {
            case 'spray':
                game.player.setWeapon('spray', this.duration);
                showNotification('SPRAY GUN ACTIVATED');
                break;
                
            case 'nuke':
                // Clear all zombies and add to score
                const zombieCount = game.zombies.length;
                game.score += zombieCount;
                updateElement('score', game.score);
                
                // Visual effect for nuke
                game.nukeEffect = 1.0; // Start the nuke visual effect
                
                // Clear zombies
                game.zombies = [];
                updateElement('zombies', 0);
                
                showNotification(`NUKE! +${zombieCount} SCORE`);
                break;
                
            case 'shield':
                game.player.activateShield(this.duration);
                showNotification('SHIELD ACTIVATED');
                break;
                
            case 'speed':
                game.player.activateSpeedBoost(this.duration);
                showNotification('SPEED BOOST ACTIVATED');
                break;
                
            case 'regeneration':
                game.player.activateRegeneration(this.duration);
                showNotification('REGENERATION ACTIVATED');
                break;
        }
    }

    static generateRandom(canvasWidth, canvasHeight, offsetX, offsetY, mapWidth, mapHeight) {
        // Determine type with weighted probability
        const rand = Math.random();
        let type;
        
        if (rand < 0.3) {
            type = 'spray'; // 30% chance
        } else if (rand < 0.35) {
            type = 'nuke'; // 5% chance (rare)
        } else if (rand < 0.55) {
            type = 'shield'; // 20% chance
        } else if (rand < 0.8) {
            type = 'speed'; // 25% chance
        } else {
            type = 'regeneration'; // 20% chance
        }
        
        // Generate position within the visible area, plus a margin
        const margin = 100; // Keep power-ups away from screen edges
        
        // Try to spawn within visible area first
        let x = offsetX + random(margin, canvasWidth - margin);
        let y = offsetY + random(margin, canvasHeight - margin);
        
        // Clamp to map boundaries
        x = clamp(x, margin, mapWidth - margin);
        y = clamp(y, margin, mapHeight - margin);
        
        return new Powerup(x, y, type);
    }
}
