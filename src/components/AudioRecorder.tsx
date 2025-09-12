import { useState } from 'react'
import { startRecording, stopRecording, downloadRecording } from '../utils/chromeMessages'

interface AudioRecorderProps {
  isRecording: boolean
  onRecordingChange: (recording: boolean) => void
}

function AudioRecorder({ isRecording, onRecordingChange }: AudioRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStartRecording = async () => {
    setIsProcessing(true)
    try {
      await startRecording()
      onRecordingChange(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to start recording: ${errorMessage}`)
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
      </div>
    </div>
  )
}

export default AudioRecorder