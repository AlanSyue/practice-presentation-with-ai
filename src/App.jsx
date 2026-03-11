import { useState, useCallback } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoginScreen from './components/LoginScreen'
import LoadSlides from './components/LoadSlides'
import RecordingScreen from './components/RecordingScreen'
import ProcessingScreen from './components/ProcessingScreen'
import ResultScreen from './components/ResultScreen'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function AppContent() {
  const [accessToken, setAccessToken] = useState(
    () => sessionStorage.getItem('google_access_token') || null
  )
  const [screen, setScreen] = useState(
    () => sessionStorage.getItem('google_access_token') ? 'load' : 'login'
  )
  const [openaiApiKey, setOpenaiApiKey] = useState(
    () => localStorage.getItem('openai_api_key') || ''
  )
  const [presentation, setPresentation] = useState(null)
  const [thumbnails, setThumbnails] = useState([])
  const [recordingResult, setRecordingResult] = useState(null)
  const [transcriptResult, setTranscriptResult] = useState(null)

  const handleLogin = useCallback((token, apiKey) => {
    setAccessToken(token)
    sessionStorage.setItem('google_access_token', token)
    setOpenaiApiKey(apiKey)
    localStorage.setItem('openai_api_key', apiKey)
    setScreen('load')
  }, [])

  const handleLogout = useCallback(() => {
    setAccessToken(null)
    sessionStorage.removeItem('google_access_token')
    setScreen('login')
  }, [])

  const handleSlidesLoaded = useCallback((pres, thumbs) => {
    setPresentation(pres)
    setThumbnails(thumbs)
    setScreen('record')
  }, [])

  const handleRecordingDone = useCallback((result) => {
    setRecordingResult(result)
    setScreen('processing')
  }, [])

  const handleTranscriptDone = useCallback((result) => {
    setTranscriptResult(result)
    setScreen('result')
  }, [])

  const handleStartOver = useCallback(() => {
    setPresentation(null)
    setThumbnails([])
    setRecordingResult(null)
    setTranscriptResult(null)
    setScreen('load')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {screen === 'login' && (
        <LoginScreen onLogin={handleLogin} savedApiKey={openaiApiKey} />
      )}
      {screen === 'load' && (
        <LoadSlides accessToken={accessToken} onLoaded={handleSlidesLoaded} onLogout={handleLogout} />
      )}
      {screen === 'record' && (
        <RecordingScreen
          presentation={presentation}
          thumbnails={thumbnails}
          onDone={handleRecordingDone}
        />
      )}
      {screen === 'processing' && (
        <ProcessingScreen
          recordingResult={recordingResult}
          openaiApiKey={openaiApiKey}
          presentation={presentation}
          onDone={handleTranscriptDone}
          onStartOver={handleStartOver}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          transcriptResult={transcriptResult}
          recordingResult={recordingResult}
          presentation={presentation}
          thumbnails={thumbnails}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  )
}
