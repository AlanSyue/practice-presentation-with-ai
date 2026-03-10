import { useEffect, useState } from 'react'
import { transcribeAudio } from '../api/whisper'
import { alignTranscriptToSlides } from '../utils/alignTranscript'

export default function ProcessingScreen({ recordingResult, openaiApiKey, presentation, onDone }) {
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)

  const process = async () => {
    setError('')
    setRetrying(true)
    try {
      const whisperResult = await transcribeAudio(recordingResult.audioBlob, openaiApiKey)
      const aligned = alignTranscriptToSlides(
        whisperResult,
        recordingResult.slideTimestamps,
        recordingResult.totalDuration,
        presentation
      )
      onDone(aligned)
    } catch (err) {
      setError(err.message || '轉錄失敗，請重試')
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    process()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
        {error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">!</div>
            <h2 className="text-xl font-bold mb-2">轉錄失敗</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={process}
              disabled={retrying}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              重試
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">正在轉錄中...</h2>
            <p className="text-gray-500">
              正在將 {Math.round(recordingResult.totalDuration)} 秒的錄音傳送到 Whisper API
            </p>
            <p className="text-gray-400 text-sm mt-2">
              共 {presentation.slides.length} 頁投影片
            </p>
          </>
        )}
      </div>
    </div>
  )
}
