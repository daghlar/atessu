// Netlify Serverless Function for Socket.IO
const express = require('express');
const serverless = require('serverless-http');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
const roomStats = {};

// Map layout
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

// Copy all game logic functions from server.js here
// (createRoom, getTileAt, getSpawnPosition, assignCharacter, updateGame, etc.)

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

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const roomId = socket.handshake.query.room || 'default';
  
  if (!rooms[roomId]) {
    createRoom(roomId);
  }
  
  const room = rooms[roomId];
  const playerCount = Object.keys(room.players).length;
  
  if (playerCount >= 2) {
    socket.emit('room-full');
    return;
  }
  
  socket.join(roomId);
  
  let characterSelected = false;
  
  const autoSelectTimer = setTimeout(() => {
    if (!characterSelected) {
      const availableCharacters = [];
      const existingCharacters = Object.values(room.players).map(p => p.character);
      
      if (!existingCharacters.includes('fire')) availableCharacters.push('fire');
      if (!existingCharacters.includes('water')) availableCharacters.push('water');
      
      if (availableCharacters.length > 0) {
        const character = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        assignCharacter(socket, roomId, character, io);
      }
    }
  }, 8000);
  
  socket.on('character-selected', (data) => {
    if (characterSelected) return;
    
    const selectedChar = data.character;
    const existingCharacters = Object.values(room.players).map(p => p.character);
    
    if (existingCharacters.includes(selectedChar)) {
      socket.emit('character-taken', { character: selectedChar });
      return;
    }
    
    clearTimeout(autoSelectTimer);
    characterSelected = true;
    assignCharacter(socket, roomId, selectedChar, io);
  });
  
  socket.on('input', (data) => {
    if (room.inputMap[socket.id]) {
      room.inputMap[socket.id] = data;
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    if (room.players[socket.id]) {
      delete room.players[socket.id];
      delete room.inputMap[socket.id];
      
      if (Object.keys(room.players).length === 1) {
        io.to(roomId).emit('partner-left');
      }
      
      if (Object.keys(room.players).length === 0) {
        if (room.gameLoop) {
          clearInterval(room.gameLoop);
        }
        if (room.resetTimer) {
          clearTimeout(room.resetTimer);
        }
        delete rooms[roomId];
      }
    }
  });
});

function getSpawnPosition(character) {
  if (character === 'fire') {
    return { x: 64, y: 500 };
  } else {
    return { x: 736, y: 500 };
  }
}

function assignCharacter(socket, roomId, character, io) {
  const room = rooms[roomId];
  if (!room) return;
  
  const spawn = getSpawnPosition(character);
  
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

  socket.emit('player-assigned', { character, roomId });

  if (Object.keys(room.players).length === 2) {
    io.to(roomId).emit('game-start');
    
    if (!room.gameLoop) {
      room.gameLoop = setInterval(() => {
        updateGame(roomId, io);
      }, TICK_RATE);
    }
  } else {
    socket.emit('waiting-for-partner');
  }
}

function updateGame(roomId, io) {
  const room = rooms[roomId];
  if (!room || room.finished) return;
  
  // Game update logic here (simplified for serverless)
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

// Export for Netlify
module.exports.handler = serverless(app);
