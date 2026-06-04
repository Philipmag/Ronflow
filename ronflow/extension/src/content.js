/**
 * Ronflow Chrome Extension - Content Script
 * Injects floating toolbar and captures user interactions
 */

let isListening = false;
let currentSessionId = null;
let eventSequence = 0;

// Sensitive input types to skip capturing values for
const SENSITIVE_INPUT_TYPES = ['password', 'hidden', 'email'];

/**
 * Initialize content script
 */
function init() {
  console.log('[Ronflow] Content script initialized');
  
  // Check if we should auto-resume recording on page load
  chrome.storage.local.get(['currentSessionId', 'isRecording'], (result) => {
    if (result.isRecording && result.currentSessionId) {
      currentSessionId = result.currentSessionId;
      startListening();
    }
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_LISTENING':
        currentSessionId = message.sessionId;
        startListening();
        sendResponse({ success: true });
        break;
      
      case 'STOP_LISTENING':
        stopListening();
        sendResponse({ success: true });
        break;
      
      case 'PAGE_NAVIGATED':
        handleNavigation(message.event);
        sendResponse({ success: true });
        break;
      
      default:
        sendResponse({ error: 'Unknown message type' });
    }
    
    return true;
  });
}

/**
 * Start listening for user interactions
 */
function startListening() {
  if (isListening) return;
  
  isListening = true;
  eventSequence = 0;
  
  console.log('[Ronflow] Started listening for interactions');
  
  // Add event listeners
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('scroll', handleScroll, true);
  
  // Create floating toolbar if not exists
  createFloatingToolbar();
}

/**
 * Stop listening for user interactions
 */
function stopListening() {
  isListening = false;
  
  console.log('[Ronflow] Stopped listening for interactions');
  
  // Remove event listeners
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('submit', handleSubmit, true);
  document.removeEventListener('scroll', handleScroll, true);
  
  // Remove floating toolbar
  removeFloatingToolbar();
}

/**
 * Handle click events
 */
function handleClick(event) {
  if (!isListening) return;
  
  const target = event.target;
  if (!target || target === document) return;
  
  // Ignore clicks on Ronflow toolbar
  if (target.closest('#ronflow-toolbar')) return;
  
  eventSequence++;
  
  const eventData = {
    id: `click-${Date.now()}-${eventSequence}`,
    actionType: 'click',
    timestamp: Date.now(),
    sequenceNumber: eventSequence,
    pageTitle: document.title,
    url: window.location.href,
    elementDetails: getElementDetails(target),
    annotation: getAnnotationData(target)
  };
  
  sendEventToBackground(eventData);
}

/**
 * Handle keyboard events (for shortcuts and form submissions)
 */
function handleKeyDown(event) {
  if (!isListening) return;
  
  // Only capture Enter key on form elements or meaningful shortcuts
  if (event.key !== 'Enter') return;
  
  const target = event.target;
  if (!target) return;
  
  // Ignore if typing in a text area (Enter might be intentional newline)
  if (target.tagName === 'TEXTAREA') return;
  
  eventSequence++;
  
  const eventData = {
    id: `keypress-${Date.now()}-${eventSequence}`,
    actionType: 'keypress',
    key: event.key,
    timestamp: Date.now(),
    sequenceNumber: eventSequence,
    pageTitle: document.title,
    url: window.location.href,
    elementDetails: getElementDetails(target),
    annotation: getAnnotationData(target)
  };
  
  sendEventToBackground(eventData);
}

/**
 * Handle input events (text entry)
 */
function handleInput(event) {
  if (!isListening) return;
  
  const target = event.target;
  if (!target || !isFormElement(target)) return;
  
  // Skip sensitive fields
  if (isSensitiveField(target)) return;
  
  // Debounce rapid input events - only capture after pause
  if (target._ronflowInputTimeout) {
    clearTimeout(target._ronflowInputTimeout);
  }
  
  target._ronflowInputTimeout = setTimeout(() => {
    eventSequence++;
    
    const eventData = {
      id: `input-${Date.now()}-${eventSequence}`,
      actionType: 'type',
      timestamp: Date.now(),
      sequenceNumber: eventSequence,
      pageTitle: document.title,
      url: window.location.href,
      elementDetails: getElementDetails(target),
      annotation: getAnnotationData(target)
    };
    
    sendEventToBackground(eventData);
  }, 500); // Wait 500ms after last input
}

/**
 * Handle change events (select dropdowns, checkboxes, radio buttons)
 */
function handleChange(event) {
  if (!isListening) return;
  
  const target = event.target;
  if (!target) return;
  
  // Skip sensitive fields
  if (isSensitiveField(target)) return;
  
  eventSequence++;
  
  const eventData = {
    id: `change-${Date.now()}-${eventSequence}`,
    actionType: getChangeActionType(target),
    timestamp: Date.now(),
    sequenceNumber: eventSequence,
    pageTitle: document.title,
    url: window.location.href,
    elementDetails: getElementDetails(target),
    annotation: getAnnotationData(target)
  };
  
  sendEventToBackground(eventData);
}

/**
 * Handle form submit events
 */
function handleSubmit(event) {
  if (!isListening) return;
  
  const target = event.target;
  if (!target || target.tagName !== 'FORM') return;
  
  eventSequence++;
  
  const eventData = {
    id: `submit-${Date.now()}-${eventSequence}`,
    actionType: 'submit',
    timestamp: Date.now(),
    sequenceNumber: eventSequence,
    pageTitle: document.title,
    url: window.location.href,
    elementDetails: {
      tag: 'FORM',
      text: 'Submit Form',
      ariaLabel: target.getAttribute('aria-label') || 'Form submission',
      placeholder: '',
      name: target.getAttribute('name') || '',
      id: target.getAttribute('id') || ''
    },
    annotation: getAnnotationData(target)
  };
  
  sendEventToBackground(eventData);
}

/**
 * Handle scroll events (debounced)
 */
function handleScroll(event) {
  if (!isListening) return;
  
  // Debounce scroll events
  if (window._ronflowScrollTimeout) {
    clearTimeout(window._ronflowScrollTimeout);
  }
  
  window._ronflowScrollTimeout = setTimeout(() => {
    eventSequence++;
    
    const eventData = {
      id: `scroll-${Date.now()}-${eventSequence}`,
      actionType: 'scroll',
      timestamp: Date.now(),
      sequenceNumber: eventSequence,
      pageTitle: document.title,
      url: window.location.href,
      elementDetails: {
        tag: 'WINDOW',
        text: `Scrolled to ${Math.round(window.scrollY)}px`,
        ariaLabel: 'Page scroll',
        placeholder: '',
        name: '',
        id: ''
      },
      annotation: {
        x: 50,
        y: 50,
        width: 100,
        height: 20
      }
    };
    
    sendEventToBackground(eventData);
  }, 1000); // Capture scroll every second max
}

/**
 * Handle navigation events
 */
function handleNavigation(event) {
  console.log('[Ronflow] Navigation detected:', event.pageTitle);
  // Navigation is handled by background script via webNavigation API
  // This is just for logging
}

/**
 * Get details about the clicked/interacted element
 */
function getElementDetails(element) {
  return {
    tag: element.tagName,
    text: getVisibleText(element),
    ariaLabel: element.getAttribute('aria-label') || '',
    placeholder: element.getAttribute('placeholder') || '',
    name: element.getAttribute('name') || '',
    id: element.getAttribute('id') || '',
    className: element.getAttribute('class') || '',
    type: element.getAttribute('type') || '',
    value: isSensitiveField(element) ? '[REDACTED]' : (element.value || ''),
    href: element.href || ''
  };
}

/**
 * Get visible text content of an element
 */
function getVisibleText(element) {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return element.value || element.placeholder || '';
  }
  
  if (element.tagName === 'IMG') {
    return element.alt || '';
  }
  
  if (element.tagName === 'SELECT') {
    return element.options[element.selectedIndex]?.text || '';
  }
  
  return element.textContent?.trim().substring(0, 100) || '';
}

/**
 * Check if element is a form element
 */
function isFormElement(element) {
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

/**
 * Check if element is a sensitive field
 */
function isSensitiveField(element) {
  if (!isFormElement(element)) return false;
  
  const type = element.getAttribute('type')?.toLowerCase();
  if (SENSITIVE_INPUT_TYPES.includes(type)) return true;
  
  const name = (element.getAttribute('name') || '').toLowerCase();
  const id = (element.getAttribute('id') || '').toLowerCase();
  const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();
  
  const sensitivePatterns = [
    /password/i, /passwd/i, /pwd/i, /secret/i, /token/i,
    /api[_-]?key/i, /ssn/i, /card/i, /cvv/i, /pin/i
  ];
  
  return sensitivePatterns.some(pattern => 
    pattern.test(name) || pattern.test(id) || pattern.test(placeholder)
  );
}

/**
 * Get action type for change events
 */
function getChangeActionType(element) {
  if (element.tagName === 'SELECT') return 'select';
  if (element.type === 'checkbox') return 'checkbox';
  if (element.type === 'radio') return 'radio';
  return 'change';
}

/**
 * Get annotation data for element positioning
 */
function getAnnotationData(element) {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: Math.round((rect.left + rect.width / 2) / viewportWidth * 100),
    y: Math.round((rect.top + rect.height / 2) / viewportHeight * 100),
    width: Math.round(rect.width / viewportWidth * 100),
    height: Math.round(rect.height / viewportHeight * 100),
    boundingBox: {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  };
}

/**
 * Send event to background script
 */
function sendEventToBackground(eventData) {
  chrome.runtime.sendMessage(
    {
      type: 'CAPTURE_EVENT',
      event: eventData,
      tabId: null // Will be filled by background
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Ronflow] Failed to send event:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log(`[Ronflow] Event captured: ${eventData.actionType} (#${response.sequenceNumber})`);
        updateToolbarStepCount(response.sequenceNumber);
      }
    }
  );
}

/**
 * Create floating toolbar UI
 */
function createFloatingToolbar() {
  // Remove existing toolbar if any
  removeFloatingToolbar();
  
  const toolbar = document.createElement('div');
  toolbar.id = 'ronflow-toolbar';
  toolbar.innerHTML = `
    <div class="ronflow-toolbar-content">
      <div class="ronflow-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#534AB7"/>
          <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="ronflow-status">
        <span class="ronflow-status-dot ronflow-recording"></span>
        <span class="ronflow-status-text">Recording...</span>
      </div>
      <div class="ronflow-step-count">
        <span class="ronflow-count" id="ronflow-step-count">0</span>
        <span class="ronflow-count-label">steps</span>
      </div>
      <div class="ronflow-actions">
        <button id="ronflow-pause-btn" class="ronflow-btn ronflow-btn-secondary" title="Pause">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        </button>
        <button id="ronflow-stop-btn" class="ronflow-btn ronflow-btn-primary" title="Stop & Process">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
          <span>Stop</span>
        </button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #ronflow-toolbar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    #ronflow-toolbar:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15);
    }
    .ronflow-toolbar-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }
    .ronflow-logo svg {
      display: block;
    }
    .ronflow-status {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ronflow-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
    }
    .ronflow-status-dot.ronflow-recording {
      background: #ef4444;
      animation: ronflow-pulse 2s infinite;
    }
    .ronflow-status-dot.ronflow-paused {
      background: #f59e0b;
    }
    @keyframes ronflow-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .ronflow-status-text {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
    .ronflow-step-count {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .ronflow-count {
      font-size: 16px;
      font-weight: 700;
      color: #534AB7;
    }
    .ronflow-count-label {
      font-size: 10px;
      color: #6b7280;
    }
    .ronflow-actions {
      display: flex;
      gap: 8px;
    }
    .ronflow-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ronflow-btn svg {
      flex-shrink: 0;
    }
    .ronflow-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .ronflow-btn-secondary:hover {
      background: #e5e7eb;
    }
    .ronflow-btn-primary {
      background: #534AB7;
      color: white;
    }
    .ronflow-btn-primary:hover {
      background: #4338ca;
    }
  `;
  
  toolbar.appendChild(style);
  document.body.appendChild(toolbar);
  
  // Make draggable
  makeDraggable(toolbar);
  
  // Add event listeners
  document.getElementById('ronflow-pause-btn')?.addEventListener('click', handlePauseClick);
  document.getElementById('ronflow-stop-btn')?.addEventListener('click', handleStopClick);
}

/**
 * Remove floating toolbar
 */
function removeFloatingToolbar() {
  const existing = document.getElementById('ronflow-toolbar');
  if (existing) {
    existing.remove();
  }
}

/**
 * Update step count display
 */
function updateToolbarStepCount(count) {
  const countEl = document.getElementById('ronflow-step-count');
  if (countEl) {
    countEl.textContent = count;
  }
}

/**
 * Handle pause button click
 */
function handlePauseClick() {
  chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING' }, (response) => {
    if (response && response.success) {
      updateToolbarStatus('paused');
    }
  });
}

/**
 * Handle stop button click
 */
function handleStopClick() {
  chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, async (response) => {
    if (response && response.success) {
      removeFloatingToolbar();
      isListening = false;
      
      // Send session to server for processing
      await sendSessionToServer(response.session);
    }
  });
}

/**
 * Update toolbar status indicator
 */
function updateToolbarStatus(status) {
  const dot = document.querySelector('.ronflow-status-dot');
  const text = document.querySelector('.ronflow-status-text');
  
  if (!dot || !text) return;
  
  dot.className = 'ronflow-status-dot';
  
  if (status === 'recording') {
    dot.classList.add('ronflow-recording');
    text.textContent = 'Recording...';
  } else if (status === 'paused') {
    dot.classList.add('ronflow-paused');
    text.textContent = 'Paused';
  }
}

/**
 * Make element draggable
 */
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  element.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    element.style.bottom = 'auto';
    element.style.right = 'auto';
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * Send captured session to Ronflow server for AI processing
 */
async function sendSessionToServer(session) {
  // Get server URL from storage or use default
  const result = await chrome.storage.local.get(['ronflowServerUrl']);
  const serverUrl = result.ronflowServerUrl || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${serverUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: session.id,
        startedAt: session.startedAt,
        stoppedAt: session.stoppedAt,
        events: session.events,
        tabUrl: session.tabUrl,
        tabTitle: session.tabTitle
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Ronflow] Session sent to server:', data);
      
      // Open dashboard with new document
      if (data.documentId) {
        window.open(`${serverUrl}/doc/${data.documentId}`, '_blank');
      }
    } else {
      console.error('[Ronflow] Failed to send session:', response.status);
    }
  } catch (err) {
    console.error('[Ronflow] Error sending session:', err);
  }
}

// Initialize on load
init();
