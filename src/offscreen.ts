// Offscreen document for handling getUserMedia in Chrome Extension v3
// This is needed because service workers can't access getUserMedia directly

let offscreenRecorder: MediaRecorder | null = null;
let offscreenChunks: Blob[] = [];
let offscreenRecording = false;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'START_OFFSCREEN_RECORDING':
      startOffscreenRecording().then(() => {
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

async function startOffscreenRecording() {
  try {
    // Check if microphone is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser');
    }

    // Get user media with proper error handling
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });

    offscreenChunks = [];
    offscreenRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    offscreenRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        offscreenChunks.push(event.data);
      }
    };

    offscreenRecorder.onstop = () => {
      offscreenRecording = false;
      // Stop all tracks to free up the microphone
      stream.getTracks().forEach(track => track.stop());
    };

    offscreenRecorder.start(1000); // Collect data every second
    offscreenRecording = true;

  } catch (error) {
    console.error('Error starting recording in offscreen:', error);
    offscreenRecording = false;
    
    // Provide more specific error messages
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow microphone access in your browser settings and reload the extension.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please ensure a microphone is connected to your device.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Microphone is already in use by another application. Please close other applications using the microphone and try again.');
      } else {
        throw new Error(`Microphone access failed: ${error.message}`);
      }
    } else if (error instanceof Error) {
      throw new Error(`Microphone access failed: ${error.message}`);
    } else {
      throw new Error('Unknown error occurred while accessing microphone');
    }
  }
}

async function stopOffscreenRecording() {
  if (offscreenRecorder && offscreenRecording) {
    offscreenRecorder.stop();
    
    // Wait a bit for the recording to finish
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}