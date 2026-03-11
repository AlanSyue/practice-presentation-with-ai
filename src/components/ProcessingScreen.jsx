import { useEffect, useState } from 'react'
import { transcribeAudio } from '../api/whisper'
import { alignTranscriptToSlides } from '../utils/alignTranscript'

export default function ProcessingScreen({ recordingResult, openaiApiKey, presentation, onDone, onStartOver }) {
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [progress, setProgress] = useState(null)

  const handleDownloadAudio = () => {
    const ext = recordingResult.audioBlob.type.includes('mp4') ? 'm4a'
      : recordingResult.audioBlob.type.includes('ogg') ? 'ogg'
      : recordingResult.audioBlob.type.includes('wav') ? 'wav'
      : 'webm'
    const now = new Date()
    const ts = now.getFullYear().toString()
      + (now.getMonth() + 1).toString().padStart(2, '0')
      + now.getDate().toString().padStart(2, '0')
      + now.getHours().toString().padStart(2, '0')
      + now.getMinutes().toString().padStart(2, '0')
      + now.getSeconds().toString().padStart(2, '0')
    const url = URL.createObjectURL(recordingResult.audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${presentation?.title || 'recording'}_${ts}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const process = async () => {
    setError('')
    setRetrying(true)
    setProgress(null)
    try {
      const whisperResult = await transcribeAudio(recordingResult.audioBlob, openaiApiKey, setProgress, recordingResult.audioChunks)
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
            <div className="flex gap-3 justify-center">
              <button
                onClick={process}
                disabled={retrying}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                重試
              </button>
              <button
                onClick={handleDownloadAudio}
                className="px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                下載音檔
              </button>
            </div>
            <button
              onClick={onStartOver}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              重新開始
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {progress && progress.total > 1
                ? `正在轉錄中...（第 ${progress.current}/${progress.total} 段）`
                : '正在轉錄中...'}
            </h2>
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
