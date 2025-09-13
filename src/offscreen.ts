// Offscreen document for handling getUserMedia in Chrome Extension v3
// This is needed because service workers can't access getUserMedia directly

let offscreenRecorder: MediaRecorder | null = null;
let offscreenChunks: Blob[] = [];
let offscreenRecording = false;

// DOM elements for user feedback
let statusElement: HTMLElement | null = null;

// Initialize DOM references when document loads
document.addEventListener('DOMContentLoaded', () => {
  statusElement = document.getElementById('status');
  updateStatus('Ready to request microphone access...', 'info');
});

function updateStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
  }
  console.log(`[Offscreen] ${message}`);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'START_OFFSCREEN_RECORDING':
      startOffscreenRecording(message.userActivation).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error in offscreen recording:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
    
    case 'STOP_OFFSCREEN_RECORDING':
      stopOffscreenRecording().then(() => {
        sendResponse({ success: true, data: offscreenChunks });
      }).catch(error => {
        console.error('Error stopping offscreen recording:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
  }
});

async function startOffscreenRecording(userActivation: boolean = false) {
  try {
    updateStatus('Checking microphone availability...', 'info');
    
    // Check if microphone is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser');
    }

    // Log user activation status for debugging
    if (userActivation) {
      updateStatus('Starting with user activation context...', 'info');
    } else {
      updateStatus('Starting without explicit user activation...', 'info');
    }
    
    // Get user media directly - in Manifest V3, the offscreen document 
    // should handle permissions without pre-checking
    updateStatus('Requesting microphone access...', 'info');
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });

    updateStatus('Microphone access granted! Setting up recording...', 'success');

    offscreenChunks = [];
    
    // Check if the preferred format is supported
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let the browser choose
        }
      }
    }
    
    console.log('Using MIME type for recording:', mimeType || 'browser default');
    
    offscreenRecorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined
    });

    offscreenRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        offscreenChunks.push(event.data);
        updateStatus(`Recording... (${offscreenChunks.length} chunks collected)`, 'success');
      }
    };

    offscreenRecorder.onstop = () => {
      offscreenRecording = false;
      // Stop all tracks to free up the microphone
      stream.getTracks().forEach(track => track.stop());
      updateStatus('Recording stopped.', 'info');
    };

    offscreenRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      updateStatus('Recording error occurred', 'error');
    };

    offscreenRecorder.start(1000); // Collect data every second
    offscreenRecording = true;

    updateStatus('Recording in progress...', 'success');

  } catch (error) {
    console.error('Error starting recording in offscreen:', error);
    offscreenRecording = false;
    
    // Provide more specific error messages
    if (error instanceof DOMException) {
      console.error('DOMException details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      
      if (error.name === 'NotAllowedError') {
        updateStatus('Microphone access denied', 'error');
        throw new Error('Microphone access was denied. Please click "Allow" when Chrome asks for microphone permission, or enable microphone access in Chrome settings if permanently blocked.');
      } else if (error.name === 'NotFoundError') {
        updateStatus('No microphone found', 'error');
        throw new Error('No microphone found. Please ensure a microphone is connected to your device.');
      } else if (error.name === 'NotReadableError') {
        updateStatus('Microphone in use', 'error');
        throw new Error('Microphone is already in use by another application. Please close other applications using the microphone and try again.');
      } else if (error.name === 'AbortError') {
        updateStatus('Access aborted', 'error');
        throw new Error('Microphone access was aborted. Please try again.');
      } else if (error.name === 'OverconstrainedError') {
        updateStatus('Audio constraints not supported', 'error');
        throw new Error('The requested audio constraints cannot be satisfied by any available device.');
      } else {
        updateStatus(`Access failed: ${error.name}`, 'error');
        throw new Error(`Microphone access failed: ${error.name} - ${error.message}`);
      }
    } else if (error instanceof Error) {
      updateStatus(`Error: ${error.message}`, 'error');
      throw new Error(`Microphone access failed: ${error.message}`);
    } else {
      updateStatus('Unknown error', 'error');
      throw new Error('Unknown error occurred while accessing microphone');
    }
  }
}

async function stopOffscreenRecording() {
  if (offscreenRecorder && offscreenRecording) {
    updateStatus('Stopping recording...', 'info');
    offscreenRecorder.stop();
    
    // Wait a bit for the recording to finish
    await new Promise(resolve => setTimeout(resolve, 100));
    updateStatus(`Recording stopped. ${offscreenChunks.length} chunks collected.`, 'success');
  }
}

// Add some debugging information
console.log('Offscreen document loaded and ready');
console.log('Navigator.mediaDevices available:', !!navigator.mediaDevices);
console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

// Check for supported MIME types
if (typeof MediaRecorder !== 'undefined') {
  console.log('Supported MIME types:');
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
  types.forEach(type => {
    console.log(`  ${type}: ${MediaRecorder.isTypeSupported(type)}`);
  });
}