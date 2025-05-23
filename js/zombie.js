class Zombie {
    // Static properties to hold sprite images - use relative paths from GitHub
    static sprites = [
        'assets/zombies/s2.png',
        'assets/zombies/s3.png',
        'assets/zombies/s4.png'
    ];
    
    static images = [];
    
    // Static initialization to load images
    static initSprites() {
        // Only load once
        if (this.images.length === 0) {
            // Flag to track if any images loaded successfully
            let anyImagesLoaded = false;
            
            this.sprites.forEach((src, index) => {
                const img = new Image();
                
                // Log when each image loads or fails
                img.onload = () => {
                    console.log(`Zombie sprite ${index + 1} loaded successfully`);
                    anyImagesLoaded = true;
                };
                
                img.onerror = () => {
                    console.error(`Failed to load zombie sprite ${index + 1}: ${src}`);
                };
                
                img.src = src;
                this.images.push(img);
            });
            
            // After a short delay, check if any images loaded
            setTimeout(() => {
                if (!anyImagesLoaded) {
                    console.warn("No zombie images loaded successfully. Using circle fallback.");
                }
            }, 2000);
            
            console.log("Zombie sprites initialized:", this.sprites.length);
        }
    }

    constructor(x, y, speed, health, size = 20) {
        // Ensure sprites are loaded
        Zombie.initSprites();
        
        this.x = x;
        this.y = y;
        this.baseSpeed = speed;
        this.speed = speed;
        this.maxHealth = health;
        this.health = health;
        this.size = size;
        this.color = '#2ecc71'; // Green color (fallback)
        this.damage = 10; // Damage per hit
        this.attackCooldown = 0;
        this.knockback = 0;
        this.knockbackAngle = 0;
        this.active = true;
        
        // For death animation
        this.dying = false;
        this.deathTimer = 0;
        
        // Sprite-related properties
        this.spriteIndex = Math.floor(Math.random() * Zombie.images.length); // Random sprite
        this.facingAngle = 0; // Direction the zombie is facing
    }

    update(deltaTime, playerX, playerY) {
        // If dying, update death animation
        if (this.dying) {
            this.deathTimer += deltaTime;
            if (this.deathTimer > 0.5) { // 0.5 seconds for death animation
                this.active = false;
            }
            return;
        }
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Calculate angle to player for facing direction
        this.facingAngle = getAngle(this.x, this.y, playerX, playerY);
        
        // Apply knockback if active
        if (this.knockback > 0) {
            // Move in knockback direction
            this.x += Math.cos(this.knockbackAngle) * this.knockback * deltaTime;
            this.y += Math.sin(this.knockbackAngle) * this.knockback * deltaTime;
            
            // Reduce knockback over time
            this.knockback -= 20 * deltaTime;
            if (this.knockback < 0) this.knockback = 0;
        } else {
            // Move towards the player
            this.x += Math.cos(this.facingAngle) * this.speed * deltaTime;
            this.y += Math.sin(this.facingAngle) * this.speed * deltaTime;
        }
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x - offsetX;
        const screenY = this.y - offsetY;
        
        // Draw health bar
        if (!this.dying && this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            const barWidth = this.size * 1.5;
            const barHeight = 4;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
                screenX - barWidth / 2,
                screenY - this.size - 10,
                barWidth,
                barHeight
            );
            
            // Health
            ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(
                screenX - barWidth / 2,
                screenY - this.size - 10,
                barWidth * healthPercent,
                barHeight
            );
        }
        
        // If dying, draw death animation
        if (this.dying) {
            const progress = this.deathTimer / 0.5; // 0 to 1 over 0.5 seconds
            
            // Fade out and shrink
            ctx.globalAlpha = 1 - progress;
            
            // Use fallback circle if images aren't ready yet
            if (Zombie.images.length === 0 || !Zombie.images[this.spriteIndex] || !Zombie.images[this.spriteIndex].complete) {
                // Fallback to circle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw sprite with reduced size
                const zombieImage = Zombie.images[this.spriteIndex];
                const spriteSize = this.size * 2 * (1 - progress);
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.facingAngle - Math.PI/2); // Fix rotation to face direction of movement correctly
                ctx.drawImage(
                    zombieImage,
                    -spriteSize/2,
                    -spriteSize/2,
                    spriteSize,
                    spriteSize
                );
                ctx.restore();
            }
            
            ctx.globalAlpha = 1;
            return;
        }
        
        // Use fallback circle if images aren't ready yet
        if (Zombie.images.length === 0 || !Zombie.images[this.spriteIndex] || !Zombie.images[this.spriteIndex].complete) {
            // Draw body as a circle (fallback)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw eyes
            const eyeDistance = this.size * 0.4;
            const eyeSize = this.size * 0.25;
            
            // Calculate eye angle based on player position
            const eyeAngle = this.facingAngle;
            
            // Left eye
            const leftEyeX = screenX + Math.cos(eyeAngle) * eyeDistance - Math.sin(eyeAngle) * eyeDistance * 0.5;
            const leftEyeY = screenY + Math.sin(eyeAngle) * eyeDistance + Math.cos(eyeAngle) * eyeDistance * 0.5;
            
            // Right eye
            const rightEyeX = screenX + Math.cos(eyeAngle) * eyeDistance + Math.sin(eyeAngle) * eyeDistance * 0.5;
            const rightEyeY = screenY + Math.sin(eyeAngle) * eyeDistance - Math.cos(eyeAngle) * eyeDistance * 0.5;
            
            // Draw eyes
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw zombie sprite
            const zombieImage = Zombie.images[this.spriteIndex];
            const spriteSize = this.size * 2.5; // Make sprite a bit larger than the collision circle
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(this.facingAngle - Math.PI/2); // Fix rotation to face direction of movement correctly
            ctx.drawImage(
                zombieImage,
                -spriteSize/2,
                -spriteSize/2,
                spriteSize,
                spriteSize
            );
            ctx.restore();
        }
    }

    attack(player) {
        if (this.attackCooldown <= 0) {
            // Deal random damage between 15-30% of player's max health
            const minDamage = player.maxHealth * 0.15;  // 15% of max health
            const maxDamage = player.maxHealth * 0.30;  // 30% of max health
            const damage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage));
            
            // Deal damage to player
            player.takeDamage(damage);
            
            // Apply knockback to zombie
            const knockbackDistance = 200;
            const angle = getAngle(player.x, player.y, this.x, this.y);
            this.x += Math.cos(angle) * knockbackDistance * 0.3;
            this.y += Math.sin(angle) * knockbackDistance * 0.3;
            
            // Apply slight knockback to player
            player.applyKnockback(angle, 50);
            
            // Set attack cooldown
            this.attackCooldown = 1; // 1 second cooldown between attacks
            
            return player.health <= 0; // Return true if player died
        }
        return false;
    }

    takeDamage(damage, angle) {
        this.health -= damage;
        
        // Apply knockback
        this.knockback = 200;
        this.knockbackAngle = angle;
        
        if (this.health <= 0 && !this.dying) {
            this.dying = true;
            return true; // Return true if killed
        }
        
        return false;
    }
}
