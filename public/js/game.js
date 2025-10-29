// Proje: Ateş ve Su – 2 Oyuncu, Real-Time, Cooperative
// Phaser 3 game scene and rendering

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

// Map layout (same as server)
const mapLayout = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0],
  [0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
  [0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,4,0,0,0,5,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Tile color mapping for simple rendering
const tileColors = {
  0: null,           // empty
  1: 0x8B4513,       // platform (brown)
  2: 0xFF0000,       // red button off
  3: 0x0000FF,       // blue button off
  4: 0xFF6666,       // red door off
  5: 0x6666FF,       // blue door off
  6: 0xFF4500,       // exit fire (orange-red)
  7: 0x00BFFF,       // exit water (deep sky blue)
  8: 0xFF4500,       // lava (orange-red)
  9: 0x1E90FF        // water (dodger blue)
};

// Game state
let currentGameState = null;
let playerSprites = {};
let tileSprites = [];
let inputState = {
  left: false,
  right: false,
  jump: false
};

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  parent: 'game',
  backgroundColor: '#2d2d2d',
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// Game instance (will be created when needed)
let game = null;

// Initialize Phaser game
function initPhaserGame() {
  if (!game) {
    game = new Phaser.Game(config);
  }
}

// Expose init function
window.initPhaserGame = initPhaserGame;

function preload() {
  // Create simple colored rectangles for tiles
  createTileTextures(this);
  
  // Create player textures
  createPlayerTextures(this);
}

function create() {
  // Create map tiles
  createMap(this);
  
  // Setup input
  setupInput(this);
  
  // Expose update function to socket
  window.updateGameState = (state) => {
    currentGameState = state;
    
    // Update UI stats from game state
    if (state.level !== undefined || state.score !== undefined || state.deaths !== undefined) {
      const statsUpdate = {};
      if (state.level !== undefined) statsUpdate.level = state.level;
      if (state.score !== undefined) statsUpdate.score = state.score;
      if (state.deaths !== undefined) statsUpdate.deaths = state.deaths;
      
      if (window.updateGameStats) {
        window.updateGameStats(statsUpdate);
      }
    }
  };
}

function update() {
  // Update player sprites based on server state
  if (currentGameState && currentGameState.players) {
    updatePlayers(this, currentGameState);
  }
  
  // Update door tiles based on door state
  if (currentGameState) {
    updateDoors(this, currentGameState.doorsOpen);
  }
}

// Create simple tile textures
function createTileTextures(scene) {
  const graphics = scene.add.graphics();
  
  // Platform
  graphics.fillStyle(0x8B4513);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-platform', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Red button off
  graphics.fillStyle(0x8B0000);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-red-button-off', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Red button on
  graphics.fillStyle(0xFF0000);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-red-button-on', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Blue button off
  graphics.fillStyle(0x00008B);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-blue-button-off', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Blue button on
  graphics.fillStyle(0x0000FF);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-blue-button-on', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Red door closed
  graphics.fillStyle(0xFF6666);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-red-door-closed', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Red door open
  graphics.fillStyle(0x000000);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-red-door-open', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Blue door closed
  graphics.fillStyle(0x6666FF);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-blue-door-closed', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Blue door open
  graphics.fillStyle(0x000000);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-blue-door-open', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Exit fire
  graphics.fillStyle(0xFF4500);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-exit-fire', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Exit water
  graphics.fillStyle(0x00BFFF);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-exit-water', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Lava
  graphics.fillStyle(0xFF4500);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-lava', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  // Water
  graphics.fillStyle(0x1E90FF);
  graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.generateTexture('tile-water', TILE_SIZE, TILE_SIZE);
  graphics.clear();
  
  graphics.destroy();
}

// Create player textures
function createPlayerTextures(scene) {
  const graphics = scene.add.graphics();
  
  // Fire player (red)
  graphics.fillStyle(0xFF0000);
  graphics.fillRect(0, 0, 32, 48);
  graphics.generateTexture('player-fire', 32, 48);
  graphics.clear();
  
  // Water player (blue)
  graphics.fillStyle(0x0000FF);
  graphics.fillRect(0, 0, 32, 48);
  graphics.generateTexture('player-water', 32, 48);
  graphics.clear();
  
  graphics.destroy();
}

// Create map from layout
function createMap(scene) {
  tileSprites = [];
  
  for (let row = 0; row < mapLayout.length; row++) {
    tileSprites[row] = [];
    for (let col = 0; col < mapLayout[row].length; col++) {
      const tileType = mapLayout[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      
      let sprite = null;
      
      switch (tileType) {
        case 1:
          sprite = scene.add.sprite(x, y, 'tile-platform').setOrigin(0, 0);
          break;
        case 2:
          sprite = scene.add.sprite(x, y, 'tile-red-button-off').setOrigin(0, 0);
          sprite.tileType = 'red-button';
          break;
        case 3:
          sprite = scene.add.sprite(x, y, 'tile-blue-button-off').setOrigin(0, 0);
          sprite.tileType = 'blue-button';
          break;
        case 4:
          sprite = scene.add.sprite(x, y, 'tile-red-door-closed').setOrigin(0, 0);
          sprite.tileType = 'red-door';
          break;
        case 5:
          sprite = scene.add.sprite(x, y, 'tile-blue-door-closed').setOrigin(0, 0);
          sprite.tileType = 'blue-door';
          break;
        case 6:
          sprite = scene.add.sprite(x, y, 'tile-exit-fire').setOrigin(0, 0);
          break;
        case 7:
          sprite = scene.add.sprite(x, y, 'tile-exit-water').setOrigin(0, 0);
          break;
        case 8:
          sprite = scene.add.sprite(x, y, 'tile-lava').setOrigin(0, 0);
          break;
        case 9:
          sprite = scene.add.sprite(x, y, 'tile-water').setOrigin(0, 0);
          break;
      }
      
      tileSprites[row][col] = sprite;
    }
  }
}

// Update players based on server state
function updatePlayers(scene, state) {
  // Update or create player sprites
  for (const socketId in state.players) {
    const playerData = state.players[socketId];
    
    if (!playerSprites[socketId]) {
      // Create new player sprite
      const texture = playerData.character === 'fire' ? 'player-fire' : 'player-water';
      playerSprites[socketId] = scene.add.sprite(playerData.x, playerData.y, texture).setOrigin(0, 0);
      
      // Add label
      const label = scene.add.text(0, -10, playerData.character.toUpperCase(), {
        fontSize: '12px',
        fill: playerData.character === 'fire' ? '#FF0000' : '#0000FF',
        fontStyle: 'bold'
      }).setOrigin(0.5, 1);
      playerSprites[socketId].label = label;
    }
    
    // Update position with smooth interpolation
    const sprite = playerSprites[socketId];
    sprite.x = playerData.x;
    sprite.y = playerData.y;
    
    // Flip sprite based on direction
    if (playerData.facingRight !== undefined) {
      sprite.setFlipX(!playerData.facingRight);
    }
    
    // Add slight bounce when moving
    if (playerData.isMoving && playerData.onGround) {
      const bounce = Math.sin(Date.now() / 100) * 2;
      sprite.y += bounce;
    }
    
    // Update label position
    if (sprite.label) {
      sprite.label.x = playerData.x + 16;
      sprite.label.y = playerData.y;
    }
  }
  
  // Remove disconnected players
  for (const socketId in playerSprites) {
    if (!state.players[socketId]) {
      if (playerSprites[socketId].label) {
        playerSprites[socketId].label.destroy();
      }
      playerSprites[socketId].destroy();
      delete playerSprites[socketId];
    }
  }
}

// Update door tiles
function updateDoors(scene, doorsOpen) {
  for (let row = 0; row < tileSprites.length; row++) {
    for (let col = 0; col < tileSprites[row].length; col++) {
      const sprite = tileSprites[row][col];
      if (sprite && sprite.tileType) {
        if (sprite.tileType === 'red-door') {
          sprite.setTexture(doorsOpen ? 'tile-red-door-open' : 'tile-red-door-closed');
        } else if (sprite.tileType === 'blue-door') {
          sprite.setTexture(doorsOpen ? 'tile-blue-door-open' : 'tile-blue-door-closed');
        }
      }
    }
  }
  
  // Update button states based on player touching
  if (currentGameState && currentGameState.players) {
    for (const socketId in currentGameState.players) {
      const playerData = currentGameState.players[socketId];
      
      // Find button tile
      for (let row = 0; row < tileSprites.length; row++) {
        for (let col = 0; col < tileSprites[row].length; col++) {
          const sprite = tileSprites[row][col];
          if (sprite && sprite.tileType) {
            if (playerData.character === 'fire' && sprite.tileType === 'red-button') {
              sprite.setTexture(playerData.touchingButton ? 'tile-red-button-on' : 'tile-red-button-off');
            } else if (playerData.character === 'water' && sprite.tileType === 'blue-button') {
              sprite.setTexture(playerData.touchingButton ? 'tile-blue-button-on' : 'tile-blue-button-off');
            }
          }
        }
      }
    }
  }
}

// Setup keyboard input
function setupInput(scene) {
  const cursors = scene.input.keyboard.createCursorKeys();
  const wasd = scene.input.keyboard.addKeys('W,A,S,D');
  
  // Update input state and send to server
  scene.input.keyboard.on('keydown', (event) => {
    let changed = false;
    
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      if (!inputState.left) {
        inputState.left = true;
        changed = true;
      }
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      if (!inputState.right) {
        inputState.right = true;
        changed = true;
      }
    }
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
      if (!inputState.jump) {
        inputState.jump = true;
        changed = true;
      }
    }
    
    if (changed) {
      sendInput(inputState);
    }
  });
  
  scene.input.keyboard.on('keyup', (event) => {
    let changed = false;
    
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      if (inputState.left) {
        inputState.left = false;
        changed = true;
      }
    }
    if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      if (inputState.right) {
        inputState.right = false;
        changed = true;
      }
    }
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
      if (inputState.jump) {
        inputState.jump = false;
        changed = true;
      }
    }
    
    if (changed) {
      sendInput(inputState);
    }
  });
}
