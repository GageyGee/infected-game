# Infected: Zombie Survival Game

A browser-based zombie survival game where you fight endless waves of zombies. The game features increasing difficulty, weapon power-ups, and endless gameplay.

## Game Features

- Player centered on screen, controlled with WASD keys
- Shoot zombies with left mouse click
- Endless waves of zombies with increasing difficulty
- Power-ups: Spray Gun (multiple bullets) and Nuke (clears the screen)
- Modern UI displaying score, health, wave information
- Simple but engaging gameplay

## Demo

[Play the game on Vercel](https://your-username-infected.vercel.app)

## Screenshot

![Infected Game Screenshot](screenshot.png)

## Technologies Used

- HTML5 Canvas
- JavaScript (Vanilla)
- CSS3

## Local Development

### Prerequisites

- A modern web browser
- Basic knowledge of web development
- Git

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/infected.git
   cd infected
   ```

2. Open the project in your favorite code editor.

3. To run locally, use a local server of your choice:
   - With Node.js and `http-server`: 
     ```bash
     npm install -g http-server
     http-server
     ```
   - With Python:
     ```bash
     # Python 3
     python -m http.server
     # Python 2
     python -m SimpleHTTPServer
     ```
   - Or use a VS Code extension like "Live Server"

4. Navigate to `http://localhost:8080` (or the port provided by your server) in your browser.

## File Structure

```
infected/
├── index.html              # Main HTML file
├── styles.css              # CSS styles
├── js/
│   ├── game.js             # Main game logic
│   ├── player.js           # Player class
│   ├── zombie.js           # Zombie class
│   ├── powerup.js          # Power-up class
│   ├── bullet.js           # Bullet class
│   └── utils.js            # Utility functions
├── assets/                 # For future sprites/images
│   └── README.md
└── README.md               # This file
```

## Deployment to GitHub and Vercel

### GitHub Setup

1. Create a new repository on GitHub:
   - Go to [GitHub](https://github.com) and sign in
   - Click the "+" icon in the top right and select "New repository"
   - Name your repository (e.g., "infected")
   - Set it to public or private as preferred
   - Don't initialize with any files
   - Click "Create repository"

2. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/infected.git
   git push -u origin main
   ```

### Vercel Deployment

1. Sign up for a [Vercel account](https://vercel.com/signup) if you don't have one already.

2. Install the Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

3. Deploy with Vercel:
   
   **Option 1: Using the Vercel CLI**
   ```bash
   # Log in to Vercel
   vercel login
   
   # Deploy from your project directory
   cd infected
   vercel
   ```
   
   **Option 2: Using the Vercel web interface**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Keep all default settings (no build commands needed)
   - Click "Deploy"

4. Your game will be available at `https://infected-[username].vercel.app` or your custom domain if configured.

## Future Improvements

- Replace simple circles with proper sprites for player and zombies
- Add sound effects and background music
- Add more power-ups and weapons
- Implement a proper menu system
- Add mobile controls
- Add high score leaderboard

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic zombie survival games
- Created with vanilla JavaScript and HTML5 Canvas
