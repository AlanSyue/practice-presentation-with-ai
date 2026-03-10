import { useRef, useState, useCallback, useEffect } from 'react'

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function useRecorder() {
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const startTime = useRef(null)
  const slideTimestamps = useRef([])
  const timerRef = useRef(null)
  const pauseStartRef = useRef(null)
  const totalPausedRef = useRef(0)

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const getEffectiveElapsed = useCallback(() => {
    if (!startTime.current) return 0
    const now = Date.now()
    const paused = isPaused && pauseStartRef.current
      ? totalPausedRef.current + (now - pauseStartRef.current)
      : totalPausedRef.current
    return (now - startTime.current - paused) / 1000
  }, [isPaused])

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(getEffectiveElapsed())
    }, 100)
  }, [getEffectiveElapsed])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  const startRecording = useCallback(async (initialSlideIndex = 0) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = getSupportedMimeType()
    const options = mimeType ? { mimeType } : {}
    mediaRecorder.current = new MediaRecorder(stream, options)
    audioChunks.current = []
    slideTimestamps.current = []
    totalPausedRef.current = 0
    pauseStartRef.current = null
    startTime.current = Date.now()

    slideTimestamps.current.push({ slideIndex: initialSlideIndex, timestamp: 0 })

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data)
    }

    mediaRecorder.current.start(1000)
    setIsRecording(true)
    setIsPaused(false)
    setElapsedTime(0)
    startTimer()
  }, [startTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause()
      pauseStartRef.current = Date.now()
      stopTimer()
      setIsPaused(true)
    }
  }, [stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      totalPausedRef.current += Date.now() - pauseStartRef.current
      pauseStartRef.current = null
      mediaRecorder.current.resume()
      setIsPaused(false)
      startTimer()
    }
  }, [startTimer])

  const onSlideChange = useCallback((newSlideIndex) => {
    const elapsed = getEffectiveElapsed()
    slideTimestamps.current.push({ slideIndex: newSlideIndex, timestamp: elapsed })
  }, [getEffectiveElapsed])

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current.mimeType || 'audio/webm'
        const blob = new Blob(audioChunks.current, { type: mimeType })
        const totalDuration = getEffectiveElapsed()
        stopTimer()
        setIsRecording(false)
        setIsPaused(false)
        resolve({
          audioBlob: blob,
          slideTimestamps: slideTimestamps.current,
          totalDuration,
        })
      }
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop())
    })
  }, [getEffectiveElapsed, stopTimer])

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    onSlideChange,
    stopRecording,
    isRecording,
    isPaused,
    elapsedTime,
  }
}
