class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 200; // Player movement speed
        this.baseSpeed = 200; // Base movement speed
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
        
        // Power-up timers and effects
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
        this.regenerationActive = false;
        this.regenerationTimer = 0;
        this.regenerationInterval = 0.5; // Heal every 0.5 seconds
        this.regenerationCounter = 0;
        
        // Shooting properties
        this.fireRate = {
            pistol: 0.4, // 2.5 shots per second
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
        
        // Apply speed boost if active
        const currentSpeed = this.speedBoostActive ? this.speed * 1.5 : this.speed;
        
        // Apply movement
        this.x += dx * currentSpeed * deltaTime;
        this.y += dy * currentSpeed * deltaTime;
        
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
        
        // Update shield
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }
        
        // Update speed boost
        if (this.speedBoostActive) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedBoostActive = false;
            }
        }
        
        // Update regeneration
        if (this.regenerationActive) {
            this.regenerationTimer -= deltaTime;
            
            // Apply healing effect
            if (this.health < this.maxHealth) {
                this.regenerationCounter += deltaTime;
                if (this.regenerationCounter >= this.regenerationInterval) {
                    this.heal(2); // Heal 2 health every interval
                    this.regenerationCounter = 0;
                }
            }
            
            if (this.regenerationTimer <= 0) {
                this.regenerationActive = false;
            }
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
        
        // Shield effect
        if (this.shieldActive) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add a bit of shield glow
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size + 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Speed boost effect
        if (this.speedBoostActive) {
            // Draw speed lines
            ctx.strokeStyle = '#1abc9c';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const innerRadius = this.size + 5;
                const outerRadius = this.size + 15;
                
                ctx.beginPath();
                ctx.moveTo(
                    centerX + Math.cos(angle) * innerRadius,
                    centerY + Math.sin(angle) * innerRadius
                );
                ctx.lineTo(
                    centerX + Math.cos(angle) * outerRadius,
                    centerY + Math.sin(angle) * outerRadius
                );
                ctx.stroke();
            }
        }
        
        // Regeneration effect
        if (this.regenerationActive) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            
            // Draw pulsing circle
            const pulseSize = this.size + 5 + Math.sin(Date.now() / 200) * 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        
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
        
        // Add powerup timers
        const timers = [];
        
        if (this.weapon !== 'pistol' && this.weaponTimer > 0) {
            timers.push({
                name: this.weapon.toUpperCase(),
                time: this.weaponTimer,
                color: '#ffcc00'
            });
        }
        
        if (this.shieldActive) {
            timers.push({
                name: 'SHIELD',
                time: this.shieldTimer,
                color: '#3498db'
            });
        }
        
        if (this.speedBoostActive) {
            timers.push({
                name: 'SPEED',
                time: this.speedBoostTimer,
                color: '#1abc9c'
            });
        }
        
        if (this.regenerationActive) {
            timers.push({
                name: 'REGEN',
                time: this.regenerationTimer,
                color: '#2ecc71'
            });
        }
        
        // Draw timers
        if (timers.length > 0) {
            const yOffset = 25;
            const spacingY = 15;
            
            ctx.textAlign = 'center';
            ctx.font = '12px Arial';
            
            for (let i = 0; i < timers.length; i++) {
                const timer = timers[i];
                const y = centerY - this.size - yOffset - (spacingY * i);
                
                ctx.fillStyle = timer.color;
                const timeLeft = Math.ceil(timer.time * 10) / 10;
                ctx.fillText(`${timer.name}: ${timeLeft.toFixed(1)}s`, centerX, y);
            }
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
        // If shield is active, reduce damage
        if (this.shieldActive) {
            amount = Math.floor(amount * 0.25); // 75% damage reduction
        }
        
        if (this.invulnerable) return false;
        
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

    activateShield(duration) {
        this.shieldActive = true;
        this.shieldTimer = duration / 1000; // Convert ms to seconds
    }

    activateSpeedBoost(duration) {
        this.speedBoostActive = true;
        this.speedBoostTimer = duration / 1000; // Convert ms to seconds
    }

    activateRegeneration(duration) {
        this.regenerationActive = true;
        this.regenerationTimer = duration / 1000; // Convert ms to seconds
        this.regenerationCounter = 0;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        updateElement('health', this.health);
    }
}
