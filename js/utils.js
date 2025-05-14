// Utility functions for the game

// Distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Random number between min and max
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if two circles collide
function circleCollision(x1, y1, r1, x2, y2, r2) {
    return distance(x1, y1, x2, y2) < r1 + r2;
}

// Get angle between two points (in radians)
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Convert radians to degrees
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// Convert degrees to radians
function degToRad(deg) {
    return deg * Math.PI / 180;
}

// Update HTML element text content
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element with ID '${id}' not found`);
    }
}

// Show notification
function showNotification(message, duration = 2000) {
    const notification = document.createElement('div');
    notification.className = 'powerup-notification';
    notification.textContent = message;
    document.getElementById('game-container').appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Draw a grid on the canvas
function drawGrid(ctx, cellSize, worldOffsetX, worldOffsetY, canvasWidth, canvasHeight, color = 'rgba(255, 255, 255, 0.03)') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    // Calculate the visible grid area
    const startX = Math.floor(worldOffsetX / cellSize) * cellSize - worldOffsetX;
    const startY = Math.floor(worldOffsetY / cellSize) * cellSize - worldOffsetY;
    
    // Draw vertical lines
    for (let x = startX; x < canvasWidth; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y < canvasHeight; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}

// Check if a point is within the screen bounds with a given margin
function isOnScreen(x, y, canvasWidth, canvasHeight, margin = 0) {
    return x >= -margin && x <= canvasWidth + margin && 
           y >= -margin && y <= canvasHeight + margin;
}
