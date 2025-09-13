import { useState } from 'react'
import { startRecording, stopRecording, downloadRecording } from '../utils/chromeMessages'

interface AudioRecorderProps {
  isRecording: boolean
  onRecordingChange: (recording: boolean) => void
  onPermissionNeeded?: () => void
}

function AudioRecorder({ isRecording, onRecordingChange, onPermissionNeeded }: AudioRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartRecording = async () => {
    setIsProcessing(true)
    setError(null)
    
    try {
      console.log('Starting recording with user activation context...')
      
      // Start recording directly - user activation context will be propagated to offscreen document
      await startRecording()
      onRecordingChange(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      
      // Show permission notice for permission-related errors
      if (errorMessage.toLowerCase().includes('permission') || 
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.toLowerCase().includes('allow')) {
        onPermissionNeeded?.()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStopRecording = async () => {
    setIsProcessing(true)
    try {
      await stopRecording()
      onRecordingChange(false)
    } catch (error) {
      console.error('Failed to stop recording:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async (format: 'wav' | 'mp3') => {
    try {
      await downloadRecording(format)
    } catch (error) {
      console.error('Failed to download recording:', error)
    }
  }

  return (
    <div className="audio-recorder">
      <div className="recording-status">
        {isRecording ? (
          <div className="status recording">
            <div className="recording-indicator"></div>
            <span>Recording...</span>
          </div>
        ) : (
          <div className="status idle">
            <span>Ready to record</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <h4>⚠️ Recording Error</h4>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn btn-small">
            Dismiss
          </button>
        </div>
      )}

      <div className="controls">
        {!isRecording ? (
          <button 
            onClick={handleStartRecording}
            disabled={isProcessing}
            className="btn btn-record"
          >
            {isProcessing ? 'Starting...' : '🔴 Start Recording'}
          </button>
        ) : (
          <button 
            onClick={handleStopRecording}
            disabled={isProcessing}
            className="btn btn-stop"
          >
            {isProcessing ? 'Stopping...' : '⏹️ Stop Recording'}
          </button>
        )}
      </div>

      {!isRecording && (
        <div className="download-section">
          <h3>Download Recording</h3>
          <div className="download-controls">
            <button 
              onClick={() => handleDownload('wav')}
              className="btn btn-download"
            >
              📁 Save as WAV
            </button>
            <button 
              onClick={() => handleDownload('mp3')}
              className="btn btn-download"
            >
              📁 Save as MP3
            </button>
          </div>
        </div>
      )}

      <div className="info">
        <p>💡 Recording continues even when this popup is closed</p>
        <p>🔴 Red badge indicates active recording</p>
        <p>🎤 First use requires microphone permission</p>
      </div>
    </div>
  )
}

export default AudioRecorder