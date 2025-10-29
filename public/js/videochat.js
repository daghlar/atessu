// Video Chat with WebRTC
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let isVideoEnabled = true;
let isAudioEnabled = true;

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Initialize video chat
async function initVideoChat() {
  try {
    // Request camera and microphone permission
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: true
    });

    // Display local video
    const localVideo = document.getElementById('local-video');
    if (localVideo) {
      localVideo.srcObject = localStream;
    }

    console.log('Local video stream initialized');
    window.UI.showToast('Camera enabled! 📹', 'success');

    // Setup video controls
    setupVideoControls();

  } catch (error) {
    console.error('Error accessing media devices:', error);
    window.UI.showToast('Camera access denied. Video chat disabled.', 'error');
  }
}

// Setup video control buttons
function setupVideoControls() {
  const toggleVideoBtn = document.getElementById('toggle-video-btn');
  const toggleAudioBtn = document.getElementById('toggle-audio-btn');

  if (toggleVideoBtn) {
    toggleVideoBtn.addEventListener('click', toggleVideo);
  }

  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', toggleAudio);
  }
}

// Toggle video on/off
function toggleVideo() {
  if (!localStream) return;

  isVideoEnabled = !isVideoEnabled;
  localStream.getVideoTracks().forEach(track => {
    track.enabled = isVideoEnabled;
  });

  const btn = document.getElementById('toggle-video-btn');
  if (btn) {
    btn.classList.toggle('disabled', !isVideoEnabled);
    btn.textContent = isVideoEnabled ? '📹' : '📹❌';
  }

  window.UI.showToast(isVideoEnabled ? 'Camera on' : 'Camera off', 'info');
}

// Toggle audio on/off
function toggleAudio() {
  if (!localStream) return;

  isAudioEnabled = !isAudioEnabled;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = isAudioEnabled;
  });

  const btn = document.getElementById('toggle-audio-btn');
  if (btn) {
    btn.classList.toggle('disabled', !isAudioEnabled);
    btn.textContent = isAudioEnabled ? '🎤' : '🎤❌';
  }

  window.UI.showToast(isAudioEnabled ? 'Microphone on' : 'Microphone off', 'info');
}

// Create peer connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  // Add local stream tracks to peer connection
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }

  // Handle incoming remote stream
  peerConnection.ontrack = (event) => {
    console.log('Received remote stream');
    remoteStream = event.streams[0];
    
    const remoteVideo = document.getElementById('remote-video');
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream;
    }

    const status = document.getElementById('partner-video-status');
    if (status) {
      status.style.display = 'none';
    }

    window.UI.showToast('Partner video connected! 📹', 'success');
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && window.socket && window.socket.connected) {
      window.socket.emit('ice-candidate', {
        candidate: event.candidate,
        room: window.getRoomId()
      });
    }
  };

  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
    
    if (peerConnection.connectionState === 'disconnected') {
      window.UI.showToast('Partner video disconnected', 'error');
      const status = document.getElementById('partner-video-status');
      if (status) {
        status.style.display = 'block';
        status.textContent = 'Disconnected';
      }
    }
  };

  return peerConnection;
}

// Create and send offer
async function createOffer() {
  try {
    if (!peerConnection) {
      createPeerConnection();
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    if (window.socket && window.socket.connected) {
      window.socket.emit('webrtc-offer', {
        offer: offer,
        room: window.getRoomId()
      });
    }

    console.log('Offer created and sent');
  } catch (error) {
    console.error('Error creating offer:', error);
  }
}

// Handle incoming offer
async function handleOffer(offer) {
  try {
    if (!peerConnection) {
      createPeerConnection();
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (window.socket && window.socket.connected) {
      window.socket.emit('webrtc-answer', {
        answer: answer,
        room: window.getRoomId()
      });
    }

    console.log('Answer created and sent');
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

// Handle incoming answer
async function handleAnswer(answer) {
  try {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Answer received and set');
    }
  } catch (error) {
    console.error('Error handling answer:', error);
  }
}

// Handle ICE candidate
async function handleIceCandidate(candidate) {
  try {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added');
    }
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
}

// Stop video chat
function stopVideoChat() {
  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Clear video elements
  const localVideo = document.getElementById('local-video');
  const remoteVideo = document.getElementById('remote-video');
  
  if (localVideo) localVideo.srcObject = null;
  if (remoteVideo) remoteVideo.srcObject = null;

  console.log('Video chat stopped');
}

// Export functions
window.VideoChat = {
  init: initVideoChat,
  stop: stopVideoChat,
  createOffer,
  handleOffer,
  handleAnswer,
  handleIceCandidate
};
