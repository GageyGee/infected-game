// Main game class
class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Game state
        this.running = false;
        this.level = 1;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        
        // Map dimensions (finite map)
        this.mapWidth = 4000;
        this.mapHeight = 4000;
        
        // Grid size for background
        this.gridSize = 50;
        
        // World offset (for camera)
        this.worldOffsetX = 0;
        this.worldOffsetY = 0;
        
        // Game objects
        this.player = new Player(this.mapWidth/2, this.mapHeight/2);
        this.zombies = [];
        this.bullets = [];
        this.powerups = [];
        
        // Special effects
        this.nukeEffect = 0;
        
        // Input tracking
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Game timing
        this.lastTime = 0;
        this.powerupSpawnTimer = 0;
        this.powerupSpawnInterval = 30; // Seconds between powerup spawns
        
        // Zombie control
        this.zombiesPerLevel = 5; // Initial number of zombies (level 1)
        this.zombiesRemaining = 0;
        this.zombiesToSpawn = 0;
        
        // Minimap
        this.minimapRadius = 80;
        this.minimapScale = this.minimapRadius * 2 / Math.max(this.mapWidth, this.mapHeight);
        
        // UI elements
        this.gameOverElement = document.getElementById('game-over');
        this.restartButton = document.getElementById('restart-button');
        this.startScreenElement = document.getElementById('start-screen');
        this.playerNameInput = document.getElementById('player-name');
        this.startGameButton = document.getElementById('start-game-button');
        this.connectWalletButton = document.getElementById('connect-wallet-button');
        
        // Animation frame ID for cancellation
        this.animationFrameId = null;
        
        // Debug timers
        this.lastDebugTime = 0;
        this.stuckZombieTimer = 0;
        
        // Bind event listeners
        this.bindEventListeners();
    }

    // Initialize the game
    init() {
        console.log("Initializing game");
        
        // Stop any existing game
        if (this.running) {
            this.destroy();
        }
        
        this.resizeCanvas();
        this.running = true;
        this.gameOver = false;
        this.level = 1;
        this.score = 0;
        
        // Reset game objects
        this.zombies = [];
        this.bullets = [];
        this.powerups = [];
        
        // Create player
        this.player = new Player(this.mapWidth/2, this.mapHeight/2);
        this.worldOffsetX = this.player.x - this.canvas.width / 2;
        this.worldOffsetY = this.player.y - this.canvas.height / 2;
        
        // Reset timers
        this.powerupSpawnTimer = this.powerupSpawnInterval / 2; // Spawn first powerup sooner
        this.lastDebugTime = 0;
        this.stuckZombieTimer = 0;
        
        // Set initial zombies for level 1
        this.zombiesPerLevel = 5;
        this.zombiesRemaining = this.zombiesPerLevel;
        this.zombiesToSpawn = this.zombiesPerLevel;
        
        // Update UI
        updateElement('health', this.player.health);
        updateElement('level', this.level);
        updateElement('score', this.score);
        updateElement('score-top', this.score);
        updateElement('zombies', this.zombiesRemaining);
        updateElement('current-weapon', 'PISTOL');
        
        // Hide game over screen if visible
        this.gameOverElement.classList.add('hidden');
        
        console.log("Game initialized! Starting game loop...");
        
        // Show level 1 popup
        this.showLevelPopup(1);
        
        // Start the game loop
        this.lastTime = performance.now();
        this.startGameLoop();
    }
    
    // Start the game loop
    startGameLoop() {
        // Make sure any existing loop is cancelled first
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Start a new loop
        const gameLoopFunction = (timestamp) => {
            if (!this.running) return;
            
            try {
                // Calculate delta time in seconds
                const deltaTime = (timestamp - this.lastTime) / 1000;
                this.lastTime = timestamp;
                
                // Clear the canvas
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw background grid
                drawGrid(this.ctx, this.gridSize, this.worldOffsetX, this.worldOffsetY, 
                         this.canvas.width, this.canvas.height);
                
                // Draw map boundaries
                this.drawMapBoundaries();
                
                // Update the game state
                this.update(deltaTime);
                
                // Draw the game objects
                this.draw();
                
                // Draw minimap
                this.drawMinimap();
                
                // Decay nuke effect
                if (this.nukeEffect > 0) {
                    this.nukeEffect -= deltaTime * 2;
                    if (this.nukeEffect < 0) this.nukeEffect = 0;
                }
                
                // Request next frame
                this.animationFrameId = requestAnimationFrame(gameLoopFunction);
            } catch (error) {
                console.error("Error in game loop:", error);
                // Try to recover
                this.animationFrameId = requestAnimationFrame(gameLoopFunction);
            }
        };
        
        // Start the loop
        this.animationFrameId = requestAnimationFrame(gameLoopFunction);
        console.log("Game loop started");
    }
    
    // Start the game from the start screen
    startGame() {
        this.gameStarted = true;
        this.init();
    }
    
    // End the game and return to start screen
    endGame() {
        this.destroy();
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    // Properly destroy the game instance
    destroy() {
        console.log("Destroying game instance");
        this.running = false;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear all game objects
        this.zombies = [];
        this.bullets = [];
        this.powerups = [];
        
        // Remove any level popups
        const existingPopups = document.querySelectorAll('.level-popup');
        existingPopups.forEach(popup => popup.remove());
        
        // Clear any notifications
        const notifications = document.querySelectorAll('.powerup-notification');
        notifications.forEach(notification => notification.remove());
    }
    
    // Update game state
    update(deltaTime) {
        // Cap delta time to prevent huge jumps
        const dt = Math.min(deltaTime, 0.1);
        
        // Handle level progression and zombie spawning
        this.updateLevelAndZombies(dt);
        
        // Update player
        this.player.update(dt, this.keys);
        
        // Enforce map boundaries for player
        this.player.x = clamp(this.player.x, this.player.size, this.mapWidth - this.player.size);
        this.player.y = clamp(this.player.y, this.player.size, this.mapHeight - this.player.size);
        
        // Update camera position (centered on player)
        this.worldOffsetX = this.player.x - this.canvas.width / 2;
        this.worldOffsetY = this.player.y - this.canvas.height / 2;
        
        // Update zombies
        this.updateZombies(dt);
        
        // Update bullets
        this.updateBullets(dt);
        
        // Update powerups
        this.updatePowerups(dt);
        
        // Handle shooting
        if (this.mouseDown) {
            const bullets = this.player.shoot(this.mouseX, this.mouseY, this.lastTime);
            if (bullets) {
                this.bullets.push(...bullets);
            }
        }
        
        // Debug info every 5 seconds
        if (performance.now() - this.lastDebugTime > 5000) {
            console.log(`Game state: Level ${this.level}, Zombies: ${this.zombies.length}/${this.zombiesRemaining}`);
            this.lastDebugTime = performance.now();
        }
    }

    // Update level progression and zombie spawning
    updateLevelAndZombies(deltaTime) {
        // Check if level is complete
        if (this.zombies.length === 0 && this.zombiesToSpawn === 0) {
            // Level complete - advance to next level
            this.level++;
            
            // Calculate zombies for new level (2.5x previous level)
            this.zombiesPerLevel = Math.ceil(this.zombiesPerLevel * 2.5);
            this.zombiesRemaining = this.zombiesPerLevel;
            this.zombiesToSpawn = this.zombiesPerLevel;
            
            // Update UI
            updateElement('level', this.level);
            updateElement('zombies', this.zombiesRemaining);
            
            // Show level popup
            this.showLevelPopup(this.level);
            
            // Add healing between levels
            const healAmount = 35;
            this.player.heal(healAmount);
            showNotification(`LEVEL ${this.level}! +${healAmount} HEALTH`);
            
            console.log(`Advanced to level ${this.level} with ${this.zombiesPerLevel} zombies`);
        }
        
        // Check for stuck zombies periodically
        this.stuckZombieTimer += deltaTime;
        if (this.stuckZombieTimer > 5) { // Every 5 seconds
            this.checkForStuckZombies();
            this.stuckZombieTimer = 0;
        }
        
        // Spawn zombies if needed
        if (this.zombiesToSpawn > 0) {
            // Calculate how many zombies to spawn this frame
            const baseSpawnRate = 1 + (this.level * 0.1); // Increase with level
            const zombiesToSpawnNow = Math.min(
                Math.ceil(deltaTime * baseSpawnRate), 
                this.zombiesToSpawn,
                3 // Cap per frame to prevent too many at once
            );
            
            // Spawn zombies
            for (let i = 0; i < zombiesToSpawnNow; i++) {
                this.spawnZombie();
                this.zombiesToSpawn--;
                this.zombiesRemaining--;
            }
            
            // Update UI
            updateElement('zombies', this.zombiesRemaining);
        }
        
        // Spawn powerups occasionally
        this.powerupSpawnTimer -= deltaTime;
        if (this.powerupSpawnTimer <= 0) {
            this.spawnPowerup();
            this.powerupSpawnTimer = this.powerupSpawnInterval * (0.8 + Math.random() * 0.4); // Vary interval slightly
        }
    }
    
    // Check for stuck zombies and handle them
    checkForStuckZombies() {
        if (this.zombies.length === 0) return;
        
        // console.log(`Checking for stuck zombies. Total: ${this.zombies.length}`);
        
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            const distToPlayer = distance(zombie.x, zombie.y, this.player.x, this.player.y);
            
            // If zombie is too far away or stuck in a boundary
            if (distToPlayer > 1500 || zombie.x <= 0 || zombie.x >= this.mapWidth || 
                zombie.y <= 0 || zombie.y >= this.mapHeight) {
                
                // Move stuck zombie toward player with increased speed
                const angle = getAngle(zombie.x, zombie.y, this.player.x, this.player.y);
                zombie.x = this.player.x + Math.cos(angle) * 800; // Reposition closer to player
                zombie.y = this.player.y + Math.sin(angle) * 800;
                
                // console.log(`Repositioned stuck zombie at distance ${distToPlayer}`);
                
                // If zombie has been stuck multiple times, just remove it
                zombie.stuckCount = (zombie.stuckCount || 0) + 1;
                if (zombie.stuckCount > 3) {
                    // console.log("Removing repeatedly stuck zombie");
                    this.zombies.splice(i, 1);
                    
                    // Make sure UI is updated
                    updateElement('zombies', this.zombiesRemaining);
                }
            }
        }
    }

    // Spawn a zombie
    spawnZombie() {
        // Generate position outside of the screen but not too far
        const margin = 200; // Margin outside the screen
        const spawnAngle = Math.random() * Math.PI * 2; // Random angle around the player
        const spawnDistance = Math.random() * 300 + 400; // Between 400 and 700 pixels away
        
        // Calculate position based on angle and distance
        let x = this.player.x + Math.cos(spawnAngle) * spawnDistance;
        let y = this.player.y + Math.sin(spawnAngle) * spawnDistance;
        
        // Clamp position to map boundaries
        x = clamp(x, 50, this.mapWidth - 50);
        y = clamp(y, 50, this.mapHeight - 50);
        
        // Generate zombie with appropriate stats for the level
        const baseSpeed = 60 + Math.min(this.level * 5, 90);
        const speed = baseSpeed * (0.8 + Math.random() * 0.4);
        
        const baseHealth = 50 + Math.min(this.level * 10, 250);
        const health = baseHealth * (0.8 + Math.random() * 0.4);
        
        const baseSize = 15 + Math.min(this.level, 10);
        const size = baseSize * (0.9 + Math.random() * 0.2);
        
        const zombie = new Zombie(x, y, speed, health, size);
        
        // Add zombie to list
        this.zombies.push(zombie);
    }

    // Spawn a powerup
    spawnPowerup() {
        const powerup = Powerup.generateRandom(
            this.canvas.width,
            this.canvas.height,
            this.worldOffsetX,
            this.worldOffsetY,
            this.mapWidth,
            this.mapHeight
        );
        
        this.powerups.push(powerup);
    }

    // Update zombies
    updateZombies(deltaTime) {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            
            // Update zombie
            zombie.update(deltaTime, this.player.x, this.player.y);
            
            // Keep zombies within map boundaries
            zombie.x = clamp(zombie.x, zombie.size, this.mapWidth - zombie.size);
            zombie.y = clamp(zombie.y, zombie.size, this.mapHeight - zombie.size);
            
            // Remove inactive zombies
            if (!zombie.active) {
                this.zombies.splice(i, 1);
                continue;
            }
            
            // Check for collision with player
            if (circleCollision(
                zombie.x, zombie.y, zombie.size,
                this.player.x, this.player.y, this.player.size
            )) {
                // Zombie attacks player
                const playerDied = zombie.attack(this.player);
                
                if (playerDied) {
                    this.gameOver = true;
                    this.running = false;
                    this.showGameOver();
                }
            }
        }
        
        // Update UI with current zombie count
        updateElement('zombies', this.zombiesRemaining);
    }

    // Update bullets
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update bullet
            bullet.update(deltaTime);
            
            // Check if bullet is off-screen
            if (bullet.isOffScreen(this.canvas.width, this.canvas.height, this.worldOffsetX, this.worldOffsetY)) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check for collision with zombies
            let hit = false;
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                
                if (zombie.dying) continue; // Skip dying zombies
                
                if (circleCollision(
                    bullet.x, bullet.y, bullet.radius,
                    zombie.x, zombie.y, zombie.size
                )) {
                    // Bullet hits zombie
                    const killed = zombie.takeDamage(bullet.damage, bullet.angle);
                    
                    if (killed) {
                        this.score++;
                        updateElement('score', this.score);
                        updateElement('score-top', this.score);
                    }
                    
                    hit = true;
                    break;
                }
            }
            
            // Remove bullet if it hit something
            if (hit) {
                this.bullets.splice(i, 1);
            }
        }
    }

    // Update powerups
    updatePowerups(deltaTime) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // Update powerup
            powerup.update(deltaTime);
            
            // Check for collision with player
            if (circleCollision(
                powerup.x, powerup.y, powerup.radius,
                this.player.x, this.player.y, this.player.size
            )) {
                // Apply powerup effect
                powerup.apply(this);
                
                // Remove powerup
                this.powerups.splice(i, 1);
            }
        }
    }

    // Draw game objects
    draw() {
        // Draw nuke effect
        if (this.nukeEffect > 0) {
            this.ctx.fillStyle = `rgba(255, 100, 100, ${this.nukeEffect * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw zombies
        for (const zombie of this.zombies) {
            zombie.draw(this.ctx, this.worldOffsetX, this.worldOffsetY);
        }
        
        // Draw powerups
        for (const powerup of this.powerups) {
            powerup.draw(this.ctx, this.worldOffsetX, this.worldOffsetY);
        }
        
        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx, this.worldOffsetX, this.worldOffsetY);
        }
        
        // Draw player (always in the center)
        this.player.draw(this.ctx);
    }

    // Draw minimap
    drawMinimap() {
        const padding = 20;
        const x = padding + this.minimapRadius;
        const y = this.canvas.height - padding - this.minimapRadius;
        
        // Create clipping region for circle
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.minimapRadius, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x - this.minimapRadius, y - this.minimapRadius, 
                         this.minimapRadius * 2, this.minimapRadius * 2);
        
        // Calculate map area on minimap
        const mapX = x - this.minimapRadius;
        const mapY = y - this.minimapRadius;
        const mapSize = this.minimapRadius * 2;
        
        // Draw player position
        const playerX = mapX + (this.player.x / this.mapWidth) * mapSize;
        const playerY = mapY + (this.player.y / this.mapHeight) * mapSize;
        
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw zombies (in RED)
        this.ctx.fillStyle = '#e74c3c';
        for (const zombie of this.zombies) {
            const zombieX = mapX + (zombie.x / this.mapWidth) * mapSize;
            const zombieY = mapY + (zombie.y / this.mapHeight) * mapSize;
            
            this.ctx.beginPath();
            this.ctx.arc(zombieX, zombieY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw power-ups
        for (const powerup of this.powerups) {
            const powerupX = mapX + (powerup.x / this.mapWidth) * mapSize;
            const powerupY = mapY + (powerup.y / this.mapHeight) * mapSize;
            
            this.ctx.fillStyle = powerup.color;
            this.ctx.beginPath();
            this.ctx.arc(powerupX, powerupY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw view frustum (what's visible on screen)
        const viewX = mapX + (this.worldOffsetX / this.mapWidth) * mapSize;
        const viewY = mapY + (this.worldOffsetY / this.mapHeight) * mapSize;
        const viewWidth = (this.canvas.width / this.mapWidth) * mapSize;
        const viewHeight = (this.canvas.height / this.mapHeight) * mapSize;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
        
        // Draw map boundaries if player is near them
        const boundaryWidth = 3;
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        this.ctx.lineWidth = boundaryWidth;
        
        // Left boundary - only if close
        if (this.player.x < this.mapWidth * 0.2) {
            this.ctx.beginPath();
            this.ctx.moveTo(mapX, mapY);
            this.ctx.lineTo(mapX, mapY + mapSize);
            this.ctx.stroke();
        }
        
        // Right boundary - only if close
        if (this.player.x > this.mapWidth * 0.8) {
            this.ctx.beginPath();
            this.ctx.moveTo(mapX + mapSize, mapY);
            this.ctx.lineTo(mapX + mapSize, mapY + mapSize);
            this.ctx.stroke();
        }
        
        // Top boundary - only if close
        if (this.player.y < this.mapHeight * 0.2) {
            this.ctx.beginPath();
            this.ctx.moveTo(mapX, mapY);
            this.ctx.lineTo(mapX + mapSize, mapY);
            this.ctx.stroke();
        }
        
        // Bottom boundary - only if close
        if (this.player.y > this.mapHeight * 0.8) {
            this.ctx.beginPath();
            this.ctx.moveTo(mapX, mapY + mapSize);
            this.ctx.lineTo(mapX + mapSize, mapY + mapSize);
            this.ctx.stroke();
        }
        
        // Restore the canvas context
        this.ctx.restore();
        
        // Draw minimap border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.minimapRadius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    // Draw map boundaries
    drawMapBoundaries() {
        const boundaryThickness = 20;
        const boundaryColor = 'rgba(255, 0, 0, 0.2)';
        
        // Convert map coordinates to screen coordinates
        const left = 0 - this.worldOffsetX;
        const top = 0 - this.worldOffsetY;
        const right = this.mapWidth - this.worldOffsetX;
        const bottom = this.mapHeight - this.worldOffsetY;
        
        this.ctx.fillStyle = boundaryColor;
        
        // Draw boundaries only if they're visible on screen
        
        // Left boundary
        if (left < this.canvas.width) {
            this.ctx.fillRect(left - boundaryThickness, top - boundaryThickness, 
                             boundaryThickness, this.mapHeight + boundaryThickness * 2);
        }
        
        // Right boundary
        if (right > 0) {
            this.ctx.fillRect(right, top - boundaryThickness, 
                             boundaryThickness, this.mapHeight + boundaryThickness * 2);
        }
        
        // Top boundary
        if (top < this.canvas.height) {
            this.ctx.fillRect(left, top - boundaryThickness, 
                             this.mapWidth, boundaryThickness);
        }
        
        // Bottom boundary
        if (bottom > 0) {
            this.ctx.fillRect(left, bottom, 
                             this.mapWidth, boundaryThickness);
        }
    }

    // Show level popup
    showLevelPopup(level) {
        // Remove any existing popups
        const existingPopups = document.querySelectorAll('.level-popup');
        existingPopups.forEach(popup => popup.remove());
        
        // Create the popup
        const popup = document.createElement('div');
        popup.className = 'level-popup';
        popup.innerHTML = `<div class="level-number">LEVEL ${level}</div><div class="level-text">GET READY!</div>`;
        document.getElementById('game-container').appendChild(popup);
        
        // Remove the popup after animation completes
        setTimeout(() => {
            popup.remove();
        }, 2000);
    }

    // Show game over screen
    showGameOver() {
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Show game over element
        this.gameOverElement.classList.remove('hidden');
        
        // Make sure restart button is properly bound
        document.getElementById('restart-button').addEventListener('click', () => {
            this.gameOverElement.classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            this.init();
        });
    }

    // Resize canvas to fit window
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Bind event listeners
    bindEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'w') this.keys.w = true;
            if (e.key.toLowerCase() === 'a') this.keys.a = true;
            if (e.key.toLowerCase() === 's') this.keys.s = true;
            if (e.key.toLowerCase() === 'd') this.keys.d = true;
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'w') this.keys.w = false;
            if (e.key.toLowerCase() === 'a') this.keys.a = false;
            if (e.key.toLowerCase() === 's') this.keys.s = false;
            if (e.key.toLowerCase() === 'd') this.keys.d = false;
        });
        
        // Mouse input
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.mouseDown = true;
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left click
                this.mouseDown = false;
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        // Touch input for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mouseDown = true;
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        });
        
        window.addEventListener('touchend', (e) => {
            this.mouseDown = false;
        });
        
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        });
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Creating game instance");
    
    // Ensure any existing game is destroyed first
    if (window.gameInstance) {
        window.gameInstance.destroy();
    }
    
    // Create fresh game instance
    window.gameInstance = new Game();
    
    // Explicitly bind the start button
    document.getElementById('start-game-button').addEventListener('click', () => {
        console.log("Start game button clicked");
        
        // Make sure we have a clean game instance
        if (window.gameInstance) {
            window.gameInstance.destroy();
            window.gameInstance = new Game();
        }
        
        // Get player name
        const playerName = document.getElementById('player-name').value.trim() || 'Player';
        document.getElementById('player-name-display').textContent = playerName;
        
        // Hide start screen, show game UI
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        
        // Start the game
        window.gameInstance.startGame();
    });
    
    // Bind end game button
    document.getElementById('end-game-button').addEventListener('click', () => {
        console.log("End game button clicked");
        if (window.gameInstance) {
            window.gameInstance.endGame();
        }
    });
    
    // Also bind enter key on the name input
    document.getElementById('player-name').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('start-game-button').click();
        }
    });
    
    // Bind restart button
    document.getElementById('restart-button').addEventListener('click', () => {
        // Handle via game instance
        if (window.gameInstance) {
            window.gameInstance.gameOverElement.classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            window.gameInstance.init();
        }
    });
    
    // Bind wallet connect button
    document.getElementById('connect-wallet-button').addEventListener('click', () => {
        showNotification("Wallet connection coming soon!");
    });
});
