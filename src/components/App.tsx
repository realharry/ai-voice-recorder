import { useState, useEffect } from 'react'
import AudioRecorder from './AudioRecorder'
import { getRecordingState } from '../utils/chromeMessages'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(true)

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
      <AudioRecorder 
        isRecording={isRecording} 
        onRecordingChange={setIsRecording} 
      />
    </div>
  )
}

export default App