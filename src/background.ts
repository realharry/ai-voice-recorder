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
    console.log('Starting background recording process...');
    
    // Check if offscreen document already exists
    let hasDocument = false;
    try {
      hasDocument = await chrome.offscreen.hasDocument();
    } catch {
      // Method might not be available in older versions
      hasDocument = false;
    }

    if (!hasDocument) {
      console.log('Creating offscreen document...');
      // Create offscreen document for audio capture
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: 'Recording audio from microphone for voice recording functionality'
      });
      
      // Give the offscreen document time to load
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Sending message to offscreen document to start recording...');
    
    // Send message to offscreen document to start recording
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for offscreen document response'));
      }, 10000); // 10 second timeout
      
      chrome.runtime.sendMessage({
        action: 'START_OFFSCREEN_RECORDING'
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    if (response && (response as any).success) {
      recordingState.isRecording = true;
      updateBadge();
      console.log('Background recording started successfully');
    } else {
      const error = response && (response as any).error ? (response as any).error : 'Failed to start recording in offscreen document';
      throw new Error(error);
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
      console.log('Stopping background recording...');
      
      // Send message to offscreen document to stop recording
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for stop recording response'));
        }, 5000);
        
        chrome.runtime.sendMessage({
          action: 'STOP_OFFSCREEN_RECORDING'
        }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response && (response as any).data) {
        recordingState.recordedData = (response as any).data;
      }

      recordingState.isRecording = false;
      updateBadge();
      
      console.log('Background recording stopped successfully');
      
      // Close offscreen document after a delay
      setTimeout(async () => {
        try {
          await chrome.offscreen.closeDocument();
        } catch {
          // Document might already be closed
        }
      }, 1000);
      
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