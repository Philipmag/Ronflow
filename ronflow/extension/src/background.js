/**
 * Ronflow Chrome Extension - Background Service Worker
 * Handles screenshot capture, session management, and API communication
 */

// Session state
let currentSession = null;
let isRecording = false;
let capturedEvents = [];

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /pwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /ssn/i,
  /social[_-]?security/i,
  /card[_-]?number/i,
  /cvv/i,
  /pin/i,
  /credit[_-]?card/i
];

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Ronflow extension installed');
  chrome.storage.local.set({ 
    ronflow_installed: true,
    ronflow_version: '1.0.0'
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'START_RECORDING':
      return await startRecording(message.tabId);
    
    case 'STOP_RECORDING':
      return await stopRecording();
    
    case 'PAUSE_RECORDING':
      return pauseRecording();
    
    case 'RESUME_RECORDING':
      return resumeRecording();
    
    case 'CAPTURE_EVENT':
      return await captureEvent(message.event, message.tabId);
    
    case 'GET_SESSION_STATUS':
      return getSessionStatus();
    
    case 'CLEAR_SESSION':
      return clearSession();
    
    default:
      return { error: 'Unknown message type' };
  }
}

async function startRecording(tabId) {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  currentSession = {
    id: sessionId,
    tabId: tabId,
    startedAt: new Date().toISOString(),
    events: [],
    status: 'recording'
  };
  
  isRecording = true;
  capturedEvents = [];
  
  // Store session in chrome storage
  await chrome.storage.local.set({
    currentSessionId: sessionId,
    isRecording: true
  });
  
  // Notify content script to start listening
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'START_LISTENING',
      sessionId
    });
  } catch (err) {
    console.warn('Could not notify content script:', err);
  }
  
  return {
    success: true,
    sessionId,
    status: 'recording'
  };
}

async function stopRecording() {
  if (!currentSession) {
    return { error: 'No active session' };
  }
  
  isRecording = false;
  currentSession.status = 'stopped';
  currentSession.stoppedAt = new Date().toISOString();
  currentSession.events = capturedEvents;
  
  // Save to storage
  await chrome.storage.local.set({
    currentSessionId: null,
    isRecording: false,
    lastSession: currentSession
  });
  
  const sessionData = { ...currentSession };
  
  // Reset state
  currentSession = null;
  capturedEvents = [];
  
  return {
    success: true,
    session: sessionData
  };
}

function pauseRecording() {
  if (!currentSession) {
    return { error: 'No active session' };
  }
  
  isRecording = false;
  currentSession.status = 'paused';
  
  chrome.storage.local.set({ isRecording: false });
  
  return {
    success: true,
    status: 'paused'
  };
}

function resumeRecording() {
  if (!currentSession) {
    return { error: 'No active session' };
  }
  
  isRecording = true;
  currentSession.status = 'recording';
  
  chrome.storage.local.set({ isRecording: true });
  
  return {
    success: true,
    status: 'recording'
  };
}

async function captureEvent(event, tabId) {
  if (!isRecording || !currentSession) {
    return { skipped: true, reason: 'Not recording' };
  }
  
  // Check for sensitive data and redact if necessary
  const sanitizedEvent = sanitizeEvent(event);
  
  // Capture screenshot after event
  try {
    const screenshot = await captureScreenshot(tabId);
    sanitizedEvent.screenshot = screenshot;
  } catch (err) {
    console.warn('Screenshot capture failed:', err);
    sanitizedEvent.screenshot = null;
  }
  
  // Add timestamp and sequence number
  sanitizedEvent.timestamp = Date.now();
  sanitizedEvent.sequenceNumber = capturedEvents.length + 1;
  
  capturedEvents.push(sanitizedEvent);
  
  // Update session in storage
  await chrome.storage.local.set({
    eventCount: capturedEvents.length
  });
  
  return {
    success: true,
    eventId: sanitizedEvent.id,
    sequenceNumber: sanitizedEvent.sequenceNumber
  };
}

function sanitizeEvent(event) {
  const sanitized = { ...event };
  
  // Check if element is a sensitive field
  const elementDetails = event.elementDetails || {};
  const fieldName = elementDetails.name || elementDetails.id || elementDetails.placeholder || '';
  
  if (SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName))) {
    // Redact sensitive field information
    sanitized.isSensitive = true;
    sanitized.elementDetails = {
      ...elementDetails,
      value: '[REDACTED]',
      text: '[REDACTED]'
    };
  }
  
  return sanitized;
}

async function captureScreenshot(tabId) {
  try {
    // Capture visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 80
    });
    
    return {
      dataUrl,
      capturedAt: Date.now(),
      format: 'png'
    };
  } catch (err) {
    console.error('Screenshot capture error:', err);
    throw err;
  }
}

function getSessionStatus() {
  return {
    isRecording,
    sessionId: currentSession?.id || null,
    status: currentSession?.status || 'idle',
    eventCount: capturedEvents.length,
    startedAt: currentSession?.startedAt || null
  };
}

function clearSession() {
  currentSession = null;
  isRecording = false;
  capturedEvents = [];
  
  chrome.storage.local.remove(['currentSessionId', 'isRecording', 'eventCount']);
  
  return { success: true };
}

// Handle navigation events
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (isRecording && currentSession && details.frameId === 0) {
    try {
      const tab = await chrome.tabs.get(details.tabId);
      
      // Record navigation event
      const navEvent = {
        id: `nav-${Date.now()}`,
        actionType: 'navigate',
        pageTitle: tab.title,
        url: tab.url,
        elementDetails: {
          tag: 'WINDOW',
          text: `Navigate to ${tab.title}`,
          ariaLabel: 'Page navigation'
        },
        timestamp: Date.now()
      };
      
      capturedEvents.push(navEvent);
      
      // Notify content script of navigation
      chrome.tabs.sendMessage(details.tabId, {
        type: 'PAGE_NAVIGATED',
        event: navEvent
      }).catch(() => {}); // Ignore if content script not ready
      
    } catch (err) {
      console.warn('Navigation event handling error:', err);
    }
  }
}, {
  url: [{ schemes: ['http', 'https'] }]
});
