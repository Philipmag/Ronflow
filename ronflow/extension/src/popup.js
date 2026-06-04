/**
 * Ronflow Extension Popup Script
 */

let currentStatus = 'idle';
let currentSessionId = null;

// DOM Elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const stepCountContainer = document.getElementById('step-count-container');
const stepCountEl = document.getElementById('step-count');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const stopBtn = document.getElementById('stop-btn');
const serverStatusEl = document.getElementById('server-status');
const serverUrlEl = document.getElementById('server-url');

// Initialize popup
async function init() {
  // Load server URL from storage
  const result = await chrome.storage.local.get(['ronflowServerUrl']);
  const serverUrl = result.ronflowServerUrl || 'http://localhost:3000';
  serverUrlEl.textContent = serverUrl;
  
  // Check server connectivity
  checkServerConnectivity(serverUrl);
  
  // Get current session status
  updateUI();
  
  // Refresh status every second when popup is open
  setInterval(updateUI, 1000);
}

// Check if server is reachable
async function checkServerConnectivity(serverUrl) {
  try {
    const response = await fetch(`${serverUrl}/api/docs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      serverStatusEl.className = 'server-status connected';
      serverUrlEl.textContent = `${serverUrl} ✓`;
    } else {
      throw new Error('Server responded with error');
    }
  } catch (err) {
    serverStatusEl.className = 'server-status disconnected';
    serverUrlEl.textContent = `${serverUrl} ✗`;
  }
}

// Update UI based on current state
async function updateUI() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' });
    
    if (response) {
      currentStatus = response.status || 'idle';
      currentSessionId = response.sessionId;
      
      updateStatusDisplay(currentStatus);
      updateStepCount(response.eventCount || 0);
      updateButtonVisibility(currentStatus);
    }
  } catch (err) {
    console.warn('Failed to get session status:', err);
  }
}

// Update status indicator
function updateStatusDisplay(status) {
  statusDot.className = 'status-dot';
  
  switch (status) {
    case 'recording':
      statusDot.classList.add('recording');
      statusText.textContent = 'Recording...';
      break;
    case 'paused':
      statusDot.classList.add('paused');
      statusText.textContent = 'Paused';
      break;
    default:
      statusDot.classList.add('idle');
      statusText.textContent = 'Idle';
  }
}

// Update step count display
function updateStepCount(count) {
  if (count > 0 && currentStatus !== 'idle') {
    stepCountContainer.style.display = 'block';
    stepCountEl.textContent = count;
  } else {
    stepCountContainer.style.display = 'none';
  }
}

// Update button visibility
function updateButtonVisibility(status) {
  startBtn.style.display = status === 'idle' ? 'flex' : 'none';
  pauseBtn.style.display = status === 'recording' ? 'flex' : 'none';
  resumeBtn.style.display = status === 'paused' ? 'flex' : 'none';
  stopBtn.style.display = (status === 'recording' || status === 'paused') ? 'flex' : 'none';
}

// Start recording
async function startRecording() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab) {
      alert('No active tab found. Please open a webpage first.');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      tabId: activeTab.id
    });
    
    if (response && response.success) {
      console.log('Recording started:', response.sessionId);
      updateUI();
    } else {
      console.error('Failed to start recording:', response?.error);
      alert('Failed to start recording. Please try again.');
    }
  } catch (err) {
    console.error('Error starting recording:', err);
    alert('An error occurred while starting recording.');
  }
}

// Stop recording
async function stopRecording() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    
    if (response && response.success) {
      console.log('Recording stopped:', response.session);
      updateUI();
    } else {
      console.error('Failed to stop recording:', response?.error);
    }
  } catch (err) {
    console.error('Error stopping recording:', err);
  }
}

// Pause recording
async function pauseRecording() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING' });
    
    if (response && response.success) {
      console.log('Recording paused');
      updateUI();
    } else {
      console.error('Failed to pause recording:', response?.error);
    }
  } catch (err) {
    console.error('Error pausing recording:', err);
  }
}

// Resume recording
async function resumeRecording() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'RESUME_RECORDING' });
    
    if (response && response.success) {
      console.log('Recording resumed');
      updateUI();
    } else {
      console.error('Failed to resume recording:', response?.error);
    }
  } catch (err) {
    console.error('Error resuming recording:', err);
  }
}

// Event listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
pauseBtn.addEventListener('click', pauseRecording);
resumeBtn.addEventListener('click', resumeRecording);

// Keyboard shortcut listener
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-recording') {
    if (currentStatus === 'idle') {
      startRecording();
    } else if (currentStatus === 'recording') {
      pauseRecording();
    } else if (currentStatus === 'paused') {
      resumeRecording();
    }
  }
});

// Initialize on load
init();
