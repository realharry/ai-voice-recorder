// Utility functions for communicating with the background script

export async function startRecording(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'START_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (response?.success) {
        resolve()
      } else {
        reject(new Error('Failed to start recording'))
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