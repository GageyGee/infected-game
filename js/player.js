class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 200; // Player movement speed
        this.size = 20; // Player radius
        this.color = '#3498db'; // Blue color
        this.maxHealth = 100;
        this.health = 100;
        this.weapon = 'pistol'; // Default weapon
        this.weaponTimer = 0; // For timing weapon powerups
        this.lastShotTime = 0; // For controlling fire rate
        this.invulnerable = false; // Invulnerability after taking damage
        this.invulnerableTimer = 0;
        this.damageFlashTimer = 0; // Visual feedback for taking damage
        
        // Shooting properties
        this.fireRate = {
            pistol: 0.25, // 4 shots per second
            spray: 0.1    // 10 shots per second
        };
        
        this.bulletDamage = {
            pistol: 25,
            spray: 15
        };
        
        this.bulletSpeed = 500; // Bullet speed
    }

    update(deltaTime, keys) {
        // Movement
        let dx = 0;
        let dy = 0;
        
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }
        
        // Apply movement
        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;
        
        // Update weapon timer
        if (this.weapon !== 'pistol' && this.weaponTimer > 0) {
            this.weaponTimer -= deltaTime;
            if (this.weaponTimer <= 0) {
                this.weapon = 'pistol';
                updateElement('current-weapon', 'PISTOL');
            }
        }
        
        // Update invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
        }
    }

    draw(ctx) {
        // Player is always drawn at the center of the screen
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        // Draw health bar
        const barWidth = this.size * 2;
        const barHeight = 5;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            centerX - barWidth / 2,
            centerY - this.size - 15,
            barWidth,
            barHeight
        );
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#2ecc71' : healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(
            centerX - barWidth / 2,
            centerY - this.size - 15,
            barWidth * healthPercent,
            barHeight
        );
        
        // Invulnerability effect
        if (this.invulnerable) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Damage flash effect
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.damageFlashTimer * 2})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw player body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow based on current weapon
        ctx.shadowColor = this.weapon === 'pistol' ? '#3498db' : '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Weapon indicator
        if (this.weapon === 'spray') {
            // Draw small spray gun indicator dots
            const dotRadius = 3;
            const dotDistance = this.size * 0.7;
            
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const dotX = centerX + Math.cos(angle) * dotDistance;
                const dotY = centerY + Math.sin(angle) * dotDistance;
                
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Add timer for weapon if it's not pistol
        if (this.weapon !== 'pistol' && this.weaponTimer > 0) {
            // Convert to seconds with one decimal place
            const timeLeft = Math.ceil(this.weaponTimer * 10) / 10;
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${timeLeft.toFixed(1)}s`, centerX, centerY - this.size - 25);
        }
    }

    shoot(mouseX, mouseY, currentTime) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate angle to mouse position
        const angle = getAngle(centerX, centerY, mouseX, mouseY);
        
        // Check fire rate
        const fireRateForWeapon = this.fireRate[this.weapon];
        if (currentTime - this.lastShotTime < fireRateForWeapon) {
            return null;
        }
        
        this.lastShotTime = currentTime;
        
        // Create bullet(s) based on weapon type
        if (this.weapon === 'pistol') {
            return [new Bullet(
                this.x, 
                this.y, 
                angle, 
                this.bulletSpeed, 
                this.bulletDamage.pistol
            )];
        } else if (this.weapon === 'spray') {
            // Create multiple bullets with spread
            const bullets = [];
            const bulletCount = 3;
            
            for (let i = 0; i < bulletCount; i++) {
                bullets.push(new SprayBullet(
                    this.x,
                    this.y,
                    angle,
                    this.bulletSpeed,
                    this.bulletDamage.spray
                ));
            }
            
            return bullets;
        }
    }

    takeDamage(amount) {
        if (this.invulnerable) return;
        
        this.health -= amount;
        updateElement('health', this.health);
        
        // Visual feedback
        this.damageFlashTimer = 0.3; // 0.3 seconds flash
        
        // Set invulnerability
        this.invulnerable = true;
        this.invulnerableTimer = 0.5; // 0.5 seconds invulnerability
        
        // Check if dead
        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }
        
        return false;
    }

    setWeapon(type, duration) {
        this.weapon = type;
        this.weaponTimer = duration / 1000; // Convert ms to seconds
        updateElement('current-weapon', type.toUpperCase());
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        updateElement('health', this.health);
    }
}
