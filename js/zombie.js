class Zombie {
    constructor(x, y, speed, health, size = 20) {
        this.x = x;
        this.y = y;
        this.baseSpeed = speed;
        this.speed = speed;
        this.maxHealth = health;
        this.health = health;
        this.size = size;
        this.color = '#2ecc71'; // Green color
        this.damage = 33; // Damage per hit (3 hits to kill)
        this.attackCooldown = 0;
        this.knockback = 0;
        this.knockbackAngle = 0;
        this.active = true;
        
        // For death animation
        this.dying = false;
        this.deathTimer = 0;
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
            
            // Draw sprite with reduced size
            const zombieImage = zombieImages[this.spriteIndex];
            const spriteSize = this.size * 2 * (1 - progress);
            
            if (zombieImage && zombieImage.complete) {
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.facingAngle + Math.PI/2); // Rotate to face direction of movement
                ctx.drawImage(
                    zombieImage,
                    -spriteSize/2,
                    -spriteSize/2,
                    spriteSize,
                    spriteSize
                );
                ctx.restore();
            } else {
                // Fallback if image not loaded
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
            return;
        }
        
        // Draw zombie sprite
        const zombieImage = zombieImages[this.spriteIndex];
        const spriteSize = this.size * 2; // Make sprite a bit larger than the collision circle
        
        if (zombieImage && zombieImage.complete) {
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(this.facingAngle + Math.PI/2); // Rotate to face direction of movement
            ctx.drawImage(
                zombieImage,
                -spriteSize/2,
                -spriteSize/2,
                spriteSize,
                spriteSize
            );
            ctx.restore();
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
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

    // Static method to generate a zombie based on the level
    static generateForLevel(level, canvasWidth, canvasHeight, playerX, playerY, offsetX, offsetY) {
        // Increase zombie stats based on level
        const baseSpeed = 60 + Math.min(level * 5, 90); // Cap speed increase at level 18
        const speed = baseSpeed * (0.8 + Math.random() * 0.4); // Vary speed by ±20%
        
        const baseHealth = 50 + Math.min(level * 10, 250); // Cap health increase at level 25
        const health = baseHealth * (0.8 + Math.random() * 0.4); // Vary health by ±20%
        
        const baseSize = 15 + Math.min(level, 10); // Cap size increase at level 10
        const size = baseSize * (0.9 + Math.random() * 0.2); // Vary size by ±10%
        
        // Generate position outside of the screen but not too far
        const margin = 100; // Margin outside the screen
        const spawnAngle = Math.random() * Math.PI * 2; // Random angle around the player
        const spawnDistance = canvasWidth > canvasHeight ? canvasWidth : canvasHeight;
        
        const x = playerX + Math.cos(spawnAngle) * spawnDistance;
        const y = playerY + Math.sin(spawnAngle) * spawnDistance;
        
        return new Zombie(x, y, speed, health, size);
    }
}
