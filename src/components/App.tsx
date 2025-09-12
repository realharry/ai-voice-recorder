import { useState, useEffect } from 'react'
import AudioRecorder from './AudioRecorder'
import { getRecordingState } from '../utils/chromeMessages'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPermissionNotice, setShowPermissionNotice] = useState(false)

  useEffect(() => {
    // Get initial recording state from background script
    getRecordingState().then(state => {
      setIsRecording(state.isRecording)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎙️ Voice Recorder</h1>
        <p>Record audio in the background</p>
      </header>
      
      {showPermissionNotice && (
        <div className="permission-notice">
          <div className="notice-content">
            <h3>🔒 Microphone Permission Required</h3>
            <p>This extension needs access to your microphone to record audio.</p>
            <p><strong>When you click "Start Recording", Chrome will ask for permission. Please click "Allow" to continue.</strong></p>
            <button 
              className="close-notice"
              onClick={() => setShowPermissionNotice(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      <AudioRecorder 
        isRecording={isRecording} 
        onRecordingChange={setIsRecording}
        onPermissionNeeded={() => setShowPermissionNotice(true)}
      />
    </div>
  )
}

export default App