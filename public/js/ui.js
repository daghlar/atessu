// Proje: Ateş ve Su – 2 Oyuncu, Real-Time, Cooperative
// UI Management and Screen Navigation

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// Generate random 6-digit room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('notification-toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Copy room code to clipboard
function copyRoomCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      showToast('Room code copied! 📋', 'success');
    }).catch(() => {
      showToast('Failed to copy code', 'error');
    });
  } else {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = code;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Room code copied! 📋', 'success');
  }
}

// Update room code displays
function updateRoomCodeDisplay(code) {
  document.getElementById('current-room-code').textContent = code;
  document.getElementById('game-room-code').textContent = code;
}

// Update player status in waiting room
function updatePlayerStatus(playerNumber, connected) {
  const slot = document.getElementById(`player-slot-${playerNumber}`);
  const status = slot.querySelector('.player-status');
  
  if (connected) {
    slot.classList.add('connected');
    status.textContent = 'Connected ✓';
  } else {
    slot.classList.remove('connected');
    status.textContent = 'Waiting...';
  }
}

// Character selection timer
let selectionTimer = null;
let selectionTimeLeft = 8;

function startCharacterSelection() {
  showScreen('character-selection-screen');
  selectionTimeLeft = 8;
  
  // Update UI
  updateSelectionTimer();
  
  // Start countdown
  if (selectionTimer) {
    clearInterval(selectionTimer);
  }
  
  selectionTimer = setInterval(() => {
    selectionTimeLeft--;
    updateSelectionTimer();
    
    if (selectionTimeLeft <= 0) {
      clearInterval(selectionTimer);
      // Auto-select random character
      autoSelectCharacter();
    }
  }, 1000);
}

function updateSelectionTimer() {
  const timerBar = document.getElementById('selection-timer-bar');
  const timerText = document.getElementById('selection-timer-text');
  const countdown = document.getElementById('auto-select-countdown');
  
  if (timerBar) {
    const percentage = (selectionTimeLeft / 8) * 100;
    timerBar.style.width = percentage + '%';
    
    // Change color as time runs out
    if (selectionTimeLeft <= 3) {
      timerBar.style.background = 'linear-gradient(90deg, var(--danger-color), #ff6348)';
    }
  }
  
  if (timerText) {
    timerText.textContent = selectionTimeLeft + 's';
  }
  
  if (countdown) {
    countdown.textContent = selectionTimeLeft;
  }
}

function stopCharacterSelection() {
  if (selectionTimer) {
    clearInterval(selectionTimer);
    selectionTimer = null;
  }
}

function selectCharacter(character) {
  stopCharacterSelection();
  
  // Visual feedback
  const card = document.getElementById(`${character}-card`);
  if (card) {
    card.classList.add('selected');
    
    // Disable other card
    const otherCharacter = character === 'fire' ? 'water' : 'fire';
    const otherCard = document.getElementById(`${otherCharacter}-card`);
    if (otherCard) {
      otherCard.classList.add('disabled');
    }
  }
  
  showToast(`You selected ${character.toUpperCase()}! 🎮`, 'success');
  
  // Send selection to server
  if (window.sendCharacterSelection) {
    window.sendCharacterSelection(character);
  }
}

function autoSelectCharacter() {
  const characters = ['fire', 'water'];
  const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
  
  showToast(`Auto-selected ${randomCharacter.toUpperCase()}! ⏱️`, 'info');
  selectCharacter(randomCharacter);
}

// Initialize UI event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Create room button
  document.getElementById('create-room-btn').addEventListener('click', () => {
    const roomCode = generateRoomCode();
    window.joinRoom(roomCode);
  });
  
  // Join room button
  document.getElementById('join-room-btn').addEventListener('click', () => {
    const input = document.getElementById('room-code-input');
    const roomCode = input.value.trim().toUpperCase();
    
    if (roomCode.length === 6) {
      window.joinRoom(roomCode);
    } else {
      showToast('Please enter a valid 6-digit room code', 'error');
    }
  });
  
  // Enter key on room code input
  document.getElementById('room-code-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('join-room-btn').click();
    }
  });
  
  // Auto-uppercase room code input
  document.getElementById('room-code-input').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
  
  // Copy room code button
  document.getElementById('copy-code-btn').addEventListener('click', () => {
    const code = document.getElementById('current-room-code').textContent;
    copyRoomCode(code);
  });
  
  // Leave room button
  document.getElementById('leave-room-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the room?')) {
      window.leaveRoom();
    }
  });
  
  // Quit game button
  document.getElementById('quit-game-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to quit the game?')) {
      window.leaveRoom();
    }
  });
  
  // Character selection buttons
  document.querySelectorAll('.select-character-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const character = btn.getAttribute('data-character');
      selectCharacter(character);
    });
  });
});

// Timer functionality
let timerInterval = null;
let timerStartTime = null;

function startTimer() {
  timerStartTime = Date.now();
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
      timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  startTimer();
}

// Export functions for use in other scripts
window.UI = {
  showScreen,
  generateRoomCode,
  showToast,
  copyRoomCode,
  updateRoomCodeDisplay,
  updatePlayerStatus,
  startTimer,
  stopTimer,
  resetTimer,
  startCharacterSelection,
  stopCharacterSelection,
  selectCharacter
};

window.resetTimer = resetTimer;
window.startCharacterSelection = startCharacterSelection;
