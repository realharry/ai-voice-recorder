// Background service worker for Chrome Extension v3
let recordingState = {
  isRecording: false,
  recordedData: [] as Blob[]
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'START_RECORDING':
      startBackgroundRecording().then(() => sendResponse({ success: true })).catch(error => {
        console.error('Error starting recording:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
    
    case 'STOP_RECORDING':
      stopBackgroundRecording().then(() => sendResponse({ success: true })).catch(error => {
        console.error('Error stopping recording:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    
    case 'GET_RECORDING_STATE':
      sendResponse({ isRecording: recordingState.isRecording });
      break;
    
    case 'DOWNLOAD_RECORDING':
      downloadRecording(message.format);
      sendResponse({ success: true });
      break;
  }
});

async function startBackgroundRecording() {
  try {
    // Check if offscreen document already exists
    let hasDocument = false;
    try {
      hasDocument = await chrome.offscreen.hasDocument();
    } catch {
      // Method might not be available in older versions
    }

    if (!hasDocument) {
      // Create offscreen document for audio capture
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: 'Recording audio from microphone'
      });
    }

    // Send message to offscreen document to start recording
    const response = await chrome.runtime.sendMessage({
      action: 'START_OFFSCREEN_RECORDING'
    });

    if (response && response.success) {
      recordingState.isRecording = true;
      updateBadge();
    } else {
      throw new Error('Failed to start recording in offscreen document');
    }

  } catch (error) {
    console.error('Error starting recording:', error);
    recordingState.isRecording = false;
    updateBadge();
    throw error;
  }
}

async function stopBackgroundRecording() {
  if (recordingState.isRecording) {
    try {
      // Send message to offscreen document to stop recording
      const response = await chrome.runtime.sendMessage({
        action: 'STOP_OFFSCREEN_RECORDING'
      });

      if (response && response.data) {
        recordingState.recordedData = response.data;
      }

      recordingState.isRecording = false;
      updateBadge();
      
      // Close offscreen document
      try {
        await chrome.offscreen.closeDocument();
      } catch {
        // Document might already be closed
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      recordingState.isRecording = false;
      updateBadge();
    }
  }
}

function updateBadge() {
  const badgeText = recordingState.isRecording ? '●' : '';
  const badgeColor = recordingState.isRecording ? '#ff0000' : '#000000';
  
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

function downloadRecording(format: 'wav' | 'mp3' = 'wav') {
  if (recordingState.recordedData.length === 0) {
    console.log('No recording data available');
    return;
  }

  const blob = new Blob(recordingState.recordedData, { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  
  const filename = `voice-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

// Initialize badge on startup
updateBadge();