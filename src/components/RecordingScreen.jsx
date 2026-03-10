import { useState, useCallback } from 'react'
import { useRecorder } from '../hooks/useRecorder'
import { formatTime } from '../utils/alignTranscript'

export default function RecordingScreen({ presentation, thumbnails, onDone }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [started, setStarted] = useState(false)
  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    onSlideChange,
    stopRecording,
    isRecording,
    isPaused,
    elapsedTime,
  } = useRecorder()

  const totalSlides = presentation.slides.length

  const handleStart = useCallback(async () => {
    try {
      await startRecording(0)
      setStarted(true)
    } catch {
      alert('無法存取麥克風，請確認已授予權限')
    }
  }, [startRecording])

  const handlePrev = useCallback(() => {
    if (currentSlide > 0 && !isPaused) {
      const newIndex = currentSlide - 1
      setCurrentSlide(newIndex)
      onSlideChange(newIndex)
    }
  }, [currentSlide, isPaused, onSlideChange])

  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1 && !isPaused) {
      const newIndex = currentSlide + 1
      setCurrentSlide(newIndex)
      onSlideChange(newIndex)
    }
  }, [currentSlide, totalSlides, isPaused, onSlideChange])

  const handleStop = useCallback(async () => {
    const result = await stopRecording()
    onDone(result)
  }, [stopRecording, onDone])

  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">{presentation.title}</h2>
          <p className="text-gray-500 mb-6">共 {totalSlides} 頁 — 準備好後按下開始錄音</p>
          <button
            onClick={handleStart}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-medium hover:bg-red-600 transition-colors cursor-pointer"
          >
            開始錄音
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 font-medium">
            第 {currentSlide + 1} / {totalSlides} 頁
          </span>
          <div className="flex items-center gap-2">
            {isPaused ? (
              <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full font-medium">
                已暫停
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-500 font-medium text-sm">錄音中</span>
              </span>
            )}
            <span className="font-mono text-lg ml-2">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Slide thumbnail */}
        <div className="flex justify-center mb-6">
          <img
            src={thumbnails[currentSlide]}
            alt={`Slide ${currentSlide + 1}`}
            className="max-h-96 rounded-lg border border-gray-200 shadow-sm"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0 || isPaused}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ← 上一頁
          </button>
          <button
            onClick={handleNext}
            disabled={currentSlide === totalSlides - 1 || isPaused}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            下一頁 →
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {isPaused ? (
            <button
              onClick={resumeRecording}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer"
            >
              繼續錄音
            </button>
          ) : (
            <button
              onClick={pauseRecording}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors cursor-pointer"
            >
              暫停
            </button>
          )}
          <button
            onClick={handleStop}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors cursor-pointer"
          >
            停止錄音
          </button>
        </div>
      </div>
    </div>
  )
}
