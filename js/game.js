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
        this.wave = 1;
        this.score = 0;
        this.gameOver = false;
        
        // Grid size for background
        this.gridSize = 50;
        
        // World offset (for camera)
        this.worldOffsetX = 0;
        this.worldOffsetY = 0;
        
        // Game objects
        this.player = new Player(0, 0);
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
        this.powerupSpawnInterval = 20; // Seconds between powerup spawns
        
        // Wave control
        this.zombiesPerWave = 5; // Initial number of zombies
        this.zombiesRemaining = 0;
        this.waveDelay = 5; // Seconds between waves
        this.waveTimer = 0;
        this.waveActive = false;
        
        // UI elements
        this.gameOverElement = document.getElementById('game-over');
        this.restartButton = document.getElementById('restart-button');
        
        // Bind event listeners
        this.bindEventListeners();
    }

    // Initialize the game
    init() {
        this.resizeCanvas();
        this.running = true;
        this.gameOver = false;
        this.level = 1;
        this.wave = 1;
        this.score = 0;
        this.zombies = [];
        this.bullets = [];
        this.powerups = [];
        this.player = new Player(0, 0);
        this.worldOffsetX = 0;
        this.worldOffsetY = 0;
        this.powerupSpawnTimer = this.powerupSpawnInterval / 2; // Spawn first powerup sooner
        this.waveTimer = 3; // Short delay before first wave
        this.waveActive = false;
        this.zombiesPerWave = 5;
        this.nukeEffect = 0;
        
        // Update UI
        updateElement('health', this.player.health);
        updateElement('level', this.level);
        updateElement('score', this.score);
        updateElement('score-top', this.score);
        updateElement('wave', this.wave);
        updateElement('zombies', 0);
        updateElement('current-weapon', 'PISTOL');
        
        // Hide game over screen if visible
        this.gameOverElement.classList.add('hidden');
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Main game loop
    gameLoop(timestamp) {
        if (!this.running) return;
        
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        drawGrid(this.ctx, this.gridSize, this.worldOffsetX, this.worldOffsetY, 
                 this.canvas.width, this.canvas.height);
        
        // Update the game state
        this.update(deltaTime);
        
        // Draw the game objects
        this.draw();
        
        // Decay nuke effect
        if (this.nukeEffect > 0) {
            this.nukeEffect -= deltaTime * 2;
            if (this.nukeEffect < 0) this.nukeEffect = 0;
        }
        
        // Request next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Update game state
    update(deltaTime) {
        // Cap delta time to prevent huge jumps
        const dt = Math.min(deltaTime, 0.1);
        
        // Handle wave mechanics
        this.updateWaves(dt);
        
        // Update player
        this.player.update(dt, this.keys);
        
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
    }

    // Update wave mechanics
    updateWaves(deltaTime) {
        // If no active wave, count down to next wave
        if (!this.waveActive) {
            this.waveTimer -= deltaTime;
            
            if (this.waveTimer <= 0) {
                this.startWave();
            }
        } else {
            // Check if wave is complete
            if (this.zombies.length === 0 && this.zombiesRemaining === 0) {
                this.waveActive = false;
                this.waveTimer = this.waveDelay;
                this.level++;
                updateElement('level', this.level);
                
                // Add healing between waves
                const healAmount = 20;
                this.player.heal(healAmount);
                showNotification(`WAVE COMPLETE! +${healAmount} HEALTH`);
            }
        }
        
        // Spawn zombies if needed
        if (this.waveActive && this.zombiesRemaining > 0) {
            // Spawn zombies gradually instead of all at once
            const spawnRate = 0.5 + this.level * 0.1; // Base + level-based rate
            const zombiesToSpawn = Math.min(
                Math.floor(deltaTime * spawnRate), 
                this.zombiesRemaining
            );
            
            for (let i = 0; i < zombiesToSpawn; i++) {
                this.spawnZombie();
                this.zombiesRemaining--;
            }
        }
        
        // Spawn powerups occasionally
        this.powerupSpawnTimer -= deltaTime;
        if (this.powerupSpawnTimer <= 0) {
            this.spawnPowerup();
            this.powerupSpawnTimer = this.powerupSpawnInterval * (0.8 + Math.random() * 0.4); // Vary interval slightly
        }
    }

    // Start a new wave
    startWave() {
        this.wave++;
        this.waveActive = true;
        this.zombiesPerWave = 5 + (this.level - 1) * 2 + Math.floor(this.level / 5) * 5;
        this.zombiesRemaining = this.zombiesPerWave;
        
        // Update UI
        updateElement('wave', this.wave);
        updateElement('zombies', this.zombiesPerWave);
        
        showNotification(`WAVE ${this.wave} STARTED`);
    }

    // Spawn a zombie
    spawnZombie() {
        const zombie = Zombie.generateForLevel(
            this.level,
            this.canvas.width,
            this.canvas.height,
            this.player.x,
            this.player.y,
            this.worldOffsetX,
            this.worldOffsetY
        );
        
        this.zombies.push(zombie);
        updateElement('zombies', this.zombies.length + this.zombiesRemaining);
    }

    // Spawn a powerup
    spawnPowerup() {
        const powerup = Powerup.generateRandom(
            this.canvas.width,
            this.canvas.height,
            this.worldOffsetX,
            this.worldOffsetY
        );
        
        this.powerups.push(powerup);
    }

    // Update zombies
    updateZombies(deltaTime) {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            
            // Update zombie
            zombie.update(deltaTime, this.player.x, this.player.y);
            
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
        updateElement('zombies', this.zombies.length + this.zombiesRemaining);
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

    // Show game over screen
    showGameOver() {
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Show game over element
        this.gameOverElement.classList.remove('hidden');
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
            this.mouseDown = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
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
        
        // Restart button
        this.restartButton.addEventListener('click', () => {
            this.init();
        });
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
