// Utility functions for communicating with the background script

// Request microphone permission in popup context (with user activation)
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // Test microphone access in popup context to establish permission
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    
    // Stop the test stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    console.log('Microphone permission granted in popup context');
    return true;
  } catch (error) {
    console.error('Microphone permission denied in popup context:', error);
    return false;
  }
}

export async function startRecording(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'START_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.success) {
        resolve()
      } else {
        const errorMessage = response?.error || 'Failed to start recording'
        reject(new Error(errorMessage))
      }
    })
  })
}

export async function stopRecording(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'STOP_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.success) {
        resolve()
      } else {
        reject(new Error('Failed to stop recording'))
      }
    })
  })
}

export async function getRecordingState(): Promise<{ isRecording: boolean }> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'GET_RECORDING_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

export async function downloadRecording(format: 'wav' | 'mp3' = 'wav'): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ 
      action: 'DOWNLOAD_RECORDING', 
      format 
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.success) {
        resolve()
      } else {
        reject(new Error('Failed to download recording'))
      }
    })
  })
}