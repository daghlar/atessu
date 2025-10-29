// Proje: Ateş ve Su – 2 Oyuncu, Real-Time, Cooperative
// Server: Authoritative game logic with Socket.IO

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;

// Constants
const TILE_SIZE = 32;
const GRAVITY = 900;
const SPEED = 160;
const JUMP_VELOCITY = -420;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const TICK_RATE = 16; // ~60 FPS

// Game rooms storage
const rooms = {};

// Room statistics
const roomStats = {};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Map layout (25 columns x 19 rows, tile indices)
// 0=empty, 1=platform, 2=redButtonOff, 3=blueButtonOff, 4=redDoorOff, 5=blueDoorOff, 6=exitFire, 7=exitWater, 8=lava, 9=water
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

// Initialize room
function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
    inputMap: {},
    doorsOpen: false,
    finished: false,
    resetTimer: null,
    gameLoop: null,
    level: 1,
    score: 0,
    startTime: Date.now(),
    completedLevels: 0,
    deaths: 0
  };
  
  // Initialize stats
  if (!roomStats[roomId]) {
    roomStats[roomId] = {
      totalGames: 0,
      totalWins: 0,
      totalDeaths: 0,
      bestTime: null,
      created: Date.now()
    };
  }
}

// Get tile at position
function getTileAt(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (row < 0 || row >= mapLayout.length || col < 0 || col >= mapLayout[0].length) {
    return 0;
  }
  return mapLayout[row][col];
}

// Check AABB collision
function checkCollision(x, y, width, height, tileTypes) {
  const left = Math.floor(x / TILE_SIZE);
  const right = Math.floor((x + width - 1) / TILE_SIZE);
  const top = Math.floor(y / TILE_SIZE);
  const bottom = Math.floor((y + height - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (row >= 0 && row < mapLayout.length && col >= 0 && col < mapLayout[0].length) {
        const tile = mapLayout[row][col];
        if (tileTypes.includes(tile)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Get initial spawn position
function getSpawnPosition(character) {
  if (character === 'fire') {
    return { x: 64, y: 500 };
  } else {
    return { x: 736, y: 500 };
  }
}

// Assign character to player
function assignCharacter(socket, roomId, character) {
  const room = rooms[roomId];
  if (!room) return;
  
  const spawn = getSpawnPosition(character);
  
  // Initialize player
  room.players[socket.id] = {
    id: socket.id,
    character: character,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    onGround: false,
    touchingButton: false,
    facingRight: true,
    isMoving: false
  };

  room.inputMap[socket.id] = {
    left: false,
    right: false,
    jump: false
  };

  console.log(`Player ${socket.id} joined room ${roomId} as ${character}`);

  // Send player their character
  socket.emit('player-assigned', { character, roomId });

  // If 2 players, start game
  if (Object.keys(room.players).length === 2) {
    io.to(roomId).emit('game-start');
    console.log(`Game started in room ${roomId}`);
    
    // Start game loop if not already running
    if (!room.gameLoop) {
      room.gameLoop = setInterval(() => {
        updateGame(roomId);
      }, TICK_RATE);
    }
  } else {
    socket.emit('waiting-for-partner');
  }
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Get room from query or generate new
  const roomId = socket.handshake.query.room || 'default';
  
  // Create room if doesn't exist
  if (!rooms[roomId]) {
    createRoom(roomId);
  }

  const room = rooms[roomId];
  const playerCount = Object.keys(room.players).length;

  // Check if room is full
  if (playerCount >= 2) {
    socket.emit('room-full');
    console.log('Room full, rejecting player');
    return;
  }

  // Join room
  socket.join(roomId);

  // Wait for character selection
  let character = null;
  let characterSelected = false;
  
  // Auto-select timer (8 seconds)
  const autoSelectTimer = setTimeout(() => {
    if (!characterSelected) {
      // Auto-select random character
      const availableCharacters = [];
      const existingCharacters = Object.values(room.players).map(p => p.character);
      
      if (!existingCharacters.includes('fire')) availableCharacters.push('fire');
      if (!existingCharacters.includes('water')) availableCharacters.push('water');
      
      if (availableCharacters.length > 0) {
        character = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        console.log(`Auto-selected ${character} for player ${socket.id}`);
        assignCharacter(socket, roomId, character);
      }
    }
  }, 8000);
  
  // Handle character selection
  socket.on('character-selected', (data) => {
    console.log(`Received character selection from ${socket.id}:`, data);
    
    if (characterSelected) {
      console.log('Character already selected, ignoring');
      return;
    }
    
    const selectedChar = data.character;
    
    // Check if character is already taken
    const existingCharacters = Object.values(room.players).map(p => p.character);
    console.log('Existing characters:', existingCharacters);
    
    if (existingCharacters.includes(selectedChar)) {
      console.log(`Character ${selectedChar} is already taken`);
      socket.emit('character-taken', { character: selectedChar });
      return;
    }
    
    clearTimeout(autoSelectTimer);
    characterSelected = true;
    character = selectedChar;
    
    console.log(`Player ${socket.id} selected ${character}, assigning...`);
    assignCharacter(socket, roomId, character);
  });

  // Handle input
  socket.on('input', (data) => {
    if (room.inputMap[socket.id]) {
      room.inputMap[socket.id] = data;
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    console.log('Relaying WebRTC offer');
    socket.to(data.room).emit('webrtc-offer', { offer: data.offer });
  });

  socket.on('webrtc-answer', (data) => {
    console.log('Relaying WebRTC answer');
    socket.to(data.room).emit('webrtc-answer', { answer: data.answer });
  });

  socket.on('ice-candidate', (data) => {
    console.log('Relaying ICE candidate');
    socket.to(data.room).emit('ice-candidate', { candidate: data.candidate });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    if (room.players[socket.id]) {
      delete room.players[socket.id];
      delete room.inputMap[socket.id];

      // Notify other player
      io.to(roomId).emit('partner-left');

      // Stop game loop if no players
      if (Object.keys(room.players).length === 0) {
        if (room.gameLoop) {
          clearInterval(room.gameLoop);
          room.gameLoop = null;
        }
        if (room.resetTimer) {
          clearTimeout(room.resetTimer);
          room.resetTimer = null;
        }
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted`);
      }
    }
  });
});

// Game update loop
function updateGame(roomId) {
  const room = rooms[roomId];
  if (!room || room.finished) return;

  const deltaTime = TICK_RATE / 1000; // Convert to seconds

  // Update each player
  for (const socketId in room.players) {
    const player = room.players[socketId];
    const input = room.inputMap[socketId];

    // Apply horizontal movement
    if (input.left) {
      player.vx = -SPEED;
      player.facingRight = false;
      player.isMoving = true;
    } else if (input.right) {
      player.vx = SPEED;
      player.facingRight = true;
      player.isMoving = true;
    } else {
      player.vx = 0;
      player.isMoving = false;
    }

    // Apply gravity
    player.vy += GRAVITY * deltaTime;

    // Apply jump
    if (input.jump && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
    }

    // Update position
    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;

    // Collision detection - horizontal
    if (checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [1])) {
      player.x -= player.vx * deltaTime;
      player.vx = 0;
    }

    // Collision detection - vertical
    if (player.vy > 0) {
      // Falling - check ground
      if (checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [1])) {
        player.y = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
        player.vy = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }
    } else if (player.vy < 0) {
      // Jumping - check ceiling
      if (checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [1])) {
        player.y = Math.ceil((player.y + PLAYER_HEIGHT) / TILE_SIZE) * TILE_SIZE - PLAYER_HEIGHT;
        player.vy = 0;
      }
    }

    // Boundary check
    if (player.x < 0) player.x = 0;
    if (player.x > MAP_WIDTH - PLAYER_WIDTH) player.x = MAP_WIDTH - PLAYER_WIDTH;
    if (player.y > MAP_HEIGHT) player.y = MAP_HEIGHT - PLAYER_HEIGHT;

    // Check button collision
    const buttonTile = player.character === 'fire' ? 2 : 3;
    player.touchingButton = checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [buttonTile]);
  }

  // Check if both buttons pressed
  const playerArray = Object.values(room.players);
  if (playerArray.length === 2) {
    room.doorsOpen = playerArray[0].touchingButton && playerArray[1].touchingButton;
  }

  // Check death conditions
  for (const socketId in room.players) {
    const player = room.players[socketId];
    
    if (player.character === 'fire') {
      // Fire dies in water
      if (checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [9])) {
        handleDeath(roomId, 'Fire died in water!');
        return;
      }
    } else {
      // Water dies in lava
      if (checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [8])) {
        handleDeath(roomId, 'Water died in lava!');
        return;
      }
    }
  }

  // Check win condition
  if (playerArray.length === 2 && room.doorsOpen) {
    let fireAtExit = false;
    let waterAtExit = false;

    for (const socketId in room.players) {
      const player = room.players[socketId];
      
      if (player.character === 'fire') {
        fireAtExit = checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [6]);
      } else {
        waterAtExit = checkCollision(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, [7]);
      }
    }

    if (fireAtExit && waterAtExit) {
      handleWin(roomId);
      return;
    }
  }

  // Emit game state
  const state = {
    players: room.players,
    doorsOpen: room.doorsOpen,
    finished: room.finished,
    level: room.level,
    score: room.score,
    deaths: room.deaths
  };

  io.to(roomId).emit('game-state', state);
}

// Handle death
function handleDeath(roomId, message) {
  const room = rooms[roomId];
  room.finished = true;
  room.deaths++;
  
  if (roomStats[roomId]) {
    roomStats[roomId].totalDeaths++;
  }

  io.to(roomId).emit('death', { message, deaths: room.deaths });

  // Reset after 2 seconds
  room.resetTimer = setTimeout(() => {
    resetGame(roomId);
  }, 2000);
}

// Handle win
function handleWin(roomId) {
  const room = rooms[roomId];
  room.finished = true;
  room.completedLevels++;
  
  // Calculate score based on time and deaths
  const timeElapsed = (Date.now() - room.startTime) / 1000;
  const timeBonus = Math.max(0, 100 - Math.floor(timeElapsed));
  const deathPenalty = room.deaths * 10;
  const levelScore = Math.max(0, 100 + timeBonus - deathPenalty);
  room.score += levelScore;
  
  // Update stats
  if (roomStats[roomId]) {
    roomStats[roomId].totalWins++;
    if (!roomStats[roomId].bestTime || timeElapsed < roomStats[roomId].bestTime) {
      roomStats[roomId].bestTime = timeElapsed;
    }
  }

  io.to(roomId).emit('win', { 
    message: 'Level completed!',
    score: room.score,
    levelScore: levelScore,
    time: timeElapsed,
    level: room.level
  });

  // Reset after 3 seconds
  room.resetTimer = setTimeout(() => {
    room.level++;
    resetGame(roomId);
  }, 3000);
}

// Reset game
function resetGame(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.finished = false;
  room.doorsOpen = false;
  room.startTime = Date.now();

  // Reset player positions
  for (const socketId in room.players) {
    const player = room.players[socketId];
    const spawn = getSpawnPosition(player.character);
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.touchingButton = false;
    player.facingRight = true;
    player.isMoving = false;
  }

  // Reset input
  for (const socketId in room.inputMap) {
    room.inputMap[socketId] = {
      left: false,
      right: false,
      jump: false
    };
  }

  io.to(roomId).emit('game-reset', {
    level: room.level,
    score: room.score,
    deaths: room.deaths
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
