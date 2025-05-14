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
        
        // Apply knockback if active
        if (this.knockback > 0) {
            // Move in knockback direction
            this.x += Math.cos(this.knockbackAngle) * this.knockback * deltaTime;
            this.y += Math.sin(this.knockbackAngle) * this.knockback * deltaTime;
            
            // Reduce knockback over time
            this.knockback -= 20 * deltaTime;
            if (this.knockback < 0) this.knockback = 0;
        } else {
            // Calculate direction to the player
            const angle = getAngle(this.x, this.y, playerX, playerY);
            
            // Move towards the player
            this.x += Math.cos(angle) * this.speed * deltaTime;
            this.y += Math.sin(angle) * this.speed * deltaTime;
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
            const shrinkSize = this.size * (1 - progress);
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, shrinkSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            return;
        }
        
        // Draw body - this is the main zombie circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes without shadow effects
        const eyeDistance = this.size * 0.4;
        const eyeSize = this.size * 0.25;
        
        // Calculate eye angle based on player position
        const eyeAngle = getAngle(this.x, this.y, offsetX + ctx.canvas.width / 2, offsetY + ctx.canvas.height / 2);
        
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
