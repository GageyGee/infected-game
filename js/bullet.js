class Bullet {
    constructor(x, y, angle, speed, damage, color = '#4deefc', radius = 4) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.radius = radius;
        this.active = true;
        this.tailLength = 10; // Add a slight bullet tail
    }

    update(deltaTime) {
        // Move the bullet
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x - offsetX;
        const screenY = this.y - offsetY;
        
        // Draw bullet (round)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bullet tail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 1.5;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(
            screenX - Math.cos(this.angle) * this.tailLength,
            screenY - Math.sin(this.angle) * this.tailLength
        );
        ctx.stroke();
        
        // Add a glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Check if the bullet is off-screen
    isOffScreen(canvasWidth, canvasHeight, offsetX, offsetY) {
        const screenX = this.x - offsetX;
        const screenY = this.y - offsetY;
        
        return screenX < -50 || screenX > canvasWidth + 50 ||
               screenY < -50 || screenY > canvasHeight + 50;
    }
}

// Spray gun bullet - inherits from Bullet
class SprayBullet extends Bullet {
    constructor(x, y, angle, speed, damage) {
        // Add a small random angle to create a spray effect
        const spreadAngle = angle + (Math.random() - 0.2) * 0.4; // +/- 0.2 radians spread
        super(x, y, spreadAngle, speed, damage, '#ffcc00', 2);
    }
}
