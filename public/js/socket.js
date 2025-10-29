// Proje: Ateş ve Su – 2 Oyuncu, Real-Time, Cooperative
// Socket.IO client connection and event handlers

let socket;
let roomId;
let playerCharacter;
let gameStarted = false;
let playerCount = 0;

// Join a room
function joinRoom(code) {
  roomId = code;
  
  // Update URL
  window.history.replaceState({}, '', `?room=${roomId}`);
  
  // Show character selection screen
  window.UI.startCharacterSelection();
  
  // Connect to socket
  if (socket) {
    socket.disconnect();
  }
  
  socket = io({
    query: { room: roomId }
  });
  
  setupSocketListeners();
}

// Send character selection to server
function sendCharacterSelection(character) {
  if (socket && socket.connected) {
    socket.emit('character-selected', { character });
  }
}

// Leave room
function leaveRoom() {
  if (socket) {
    socket.disconnect();
  }
  
  gameStarted = false;
  playerCount = 0;
  roomId = null;
  playerCharacter = null;
  
  // Reset URL
  window.history.replaceState({}, '', '/');
  
  // Show lobby
  window.UI.showScreen('lobby-screen');
  
  // Reset input field
  document.getElementById('room-code-input').value = '';
  
  // Reset player status
  window.UI.updatePlayerStatus(1, false);
  window.UI.updatePlayerStatus(2, false);
}

// Setup socket event listeners
function setupSocketListeners() {
  // Connection established
  socket.on('connect', () => {
    console.log('Connected to server');
    window.UI.showToast('Connected to server', 'success');
  });

  // Room is full
  socket.on('room-full', () => {
    window.UI.showToast('Room is full! Only 2 players allowed.', 'error');
    setTimeout(() => {
      leaveRoom();
    }, 2000);
  });

  // Character taken
  socket.on('character-taken', (data) => {
    window.UI.showToast(`${data.character.toUpperCase()} is already taken! Choose another.`, 'error');
    
    // Disable the taken character card
    const takenCard = document.getElementById(`${data.character}-card`);
    if (takenCard) {
      takenCard.classList.add('disabled');
    }
  });

  // Player assigned character
  socket.on('player-assigned', (data) => {
    playerCharacter = data.character;
    console.log('Assigned character:', playerCharacter);
    
    // Stop character selection and show waiting room
    window.UI.stopCharacterSelection();
    window.UI.showScreen('waiting-screen');
    window.UI.updateRoomCodeDisplay(roomId);
    
    // Update player status
    const playerNum = playerCharacter === 'fire' ? 1 : 2;
    window.UI.updatePlayerStatus(playerNum, true);
    playerCount = 1;
  });

  // Waiting for partner
  socket.on('waiting-for-partner', () => {
    document.getElementById('waiting-text').textContent = 'Waiting for partner to join...';
    
    // Show only current player as connected
    const playerNum = playerCharacter === 'fire' ? 1 : 2;
    window.UI.updatePlayerStatus(playerNum, true);
    window.UI.updatePlayerStatus(playerNum === 1 ? 2 : 1, false);
  });

  // Game started
  socket.on('game-start', () => {
    gameStarted = true;
    playerCount = 2;
    
    // Update both players as connected
    window.UI.updatePlayerStatus(1, true);
    window.UI.updatePlayerStatus(2, true);
    
    // Show game screen
    window.UI.showScreen('game-screen');
    window.UI.updateRoomCodeDisplay(roomId);
    window.UI.showToast('Game started! Good luck! 🎮', 'success');
    
    // Start timer
    window.UI.startTimer();
    
    // Initialize Phaser game if not already
    if (window.initPhaserGame) {
      window.initPhaserGame();
    }
  });

  // Game state update
  socket.on('game-state', (state) => {
    if (window.updateGameState) {
      window.updateGameState(state);
    }
  });

  // Death event
  socket.on('death', (data) => {
    updateStatus(data.message);
    window.UI.showToast(data.message, 'error');
    
    // Update deaths display
    if (data.deaths !== undefined) {
      updateGameStats({ deaths: data.deaths });
    }
  });

  // Win event
  socket.on('win', (data) => {
    const message = `${data.message} +${data.levelScore} points! ⭐`;
    updateStatus(message);
    window.UI.showToast(message, 'success');
    
    // Update stats
    updateGameStats({
      score: data.score,
      level: data.level
    });
  });

  // Game reset
  socket.on('game-reset', (data) => {
    updateStatus('');
    
    // Update stats after reset
    if (data) {
      updateGameStats({
        level: data.level,
        score: data.score,
        deaths: data.deaths
      });
    }
    
    // Reset timer
    if (window.resetTimer) {
      window.resetTimer();
    }
  });

  // Partner left
  socket.on('partner-left', () => {
    gameStarted = false;
    playerCount = 1;
    
    window.UI.showToast('Partner left the game', 'error');
    updateStatus('Partner left. Waiting for new partner...');
    
    // Go back to waiting screen
    window.UI.showScreen('waiting-screen');
    window.UI.updateRoomCodeDisplay(roomId);
    
    // Update player status
    const playerNum = playerCharacter === 'fire' ? 1 : 2;
    window.UI.updatePlayerStatus(playerNum, true);
    window.UI.updatePlayerStatus(playerNum === 1 ? 2 : 1, false);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    
    if (gameStarted || playerCount > 0) {
      window.UI.showToast('Disconnected from server', 'error');
      setTimeout(() => {
        leaveRoom();
      }, 2000);
    }
    
    gameStarted = false;
  });

  // Connection error
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    window.UI.showToast('Connection error. Please try again.', 'error');
  });
}

// Send input to server
function sendInput(inputState) {
  if (socket && socket.connected && gameStarted) {
    socket.emit('input', inputState);
  }
}

// Update status message
function updateStatus(message) {
  const statusElement = document.getElementById('status-message');
  if (statusElement) {
    statusElement.textContent = message;
    
    // Trigger animation
    if (message) {
      statusElement.style.animation = 'none';
      setTimeout(() => {
        statusElement.style.animation = 'statusPulse 0.5s ease-in-out';
      }, 10);
    }
  }
}

// Update game stats display
function updateGameStats(stats) {
  if (stats.level !== undefined) {
    const levelEl = document.getElementById('level-display');
    if (levelEl) levelEl.textContent = stats.level;
  }
  
  if (stats.score !== undefined) {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      scoreEl.textContent = stats.score;
      // Animate score change
      scoreEl.style.animation = 'none';
      setTimeout(() => {
        scoreEl.style.animation = 'bounce 0.5s ease-in-out';
      }, 10);
    }
  }
  
  if (stats.deaths !== undefined) {
    const deathsEl = document.getElementById('deaths-display');
    if (deathsEl) deathsEl.textContent = stats.deaths;
  }
}

// Check URL for room code on load
function checkURLForRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  
  if (room && room.length === 6) {
    // Auto-join room from URL
    setTimeout(() => {
      joinRoom(room.toUpperCase());
    }, 500);
  }
}

// Initialize on page load
window.addEventListener('load', () => {
  checkURLForRoom();
});

// Export functions for global access
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.sendInput = sendInput;
window.sendCharacterSelection = sendCharacterSelection;
window.getPlayerCharacter = () => playerCharacter;
window.isGameStarted = () => gameStarted;
window.updateGameStats = updateGameStats;
