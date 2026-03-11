const MAX_CHUNK_SIZE = 24 * 1024 * 1024

function getExtension(mimeType) {
  const map = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/wav': 'wav',
    'audio/flac': 'flac',
  }
  return map[mimeType] || 'webm'
}

async function transcribeChunk(blob, ext, openaiApiKey) {
  const formData = new FormData()
  formData.append('file', blob, `recording.${ext}`)
  formData.append('model', 'whisper-1')
  formData.append('language', 'zh')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'word')

  const res = await fetch('/api/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiApiKey}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Whisper API error: ${res.status}`)
  }

  return res.json()
}

export async function transcribeAudio(audioBlob, openaiApiKey, onProgress, rawChunks) {
  const ext = getExtension(audioBlob.type)

  if (audioBlob.size <= MAX_CHUNK_SIZE) {
    onProgress?.({ current: 1, total: 1 })
    return transcribeChunk(audioBlob, ext, openaiApiKey)
  }

  // Build valid audio segments from raw MediaRecorder chunks
  // The first chunk contains the container header (EBML/init segment for WebM)
  if (!rawChunks || rawChunks.length === 0) {
    throw new Error('Audio file too large and no raw chunks available for splitting')
  }

  const headerChunk = rawChunks[0]
  const segments = []
  let currentSegmentChunks = []
  let currentSize = 0

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i]
    const chunkSize = chunk.size

    // If adding this chunk would exceed the limit, finalize current segment and start new one
    if (currentSegmentChunks.length > 0 && currentSize + chunkSize > MAX_CHUNK_SIZE) {
      segments.push(new Blob(currentSegmentChunks, { type: audioBlob.type }))
      // New segment starts with header chunk for valid container format
      currentSegmentChunks = [headerChunk]
      currentSize = headerChunk.size
    }

    currentSegmentChunks.push(chunk)
    currentSize += chunkSize
  }

  // Don't forget the last segment
  if (currentSegmentChunks.length > 0) {
    segments.push(new Blob(currentSegmentChunks, { type: audioBlob.type }))
  }

  let mergedText = ''
  let mergedWords = []
  let totalDuration = 0

  for (let i = 0; i < segments.length; i++) {
    onProgress?.({ current: i + 1, total: segments.length })

    const result = await transcribeChunk(segments[i], ext, openaiApiKey)

    if (i > 0) {
      mergedText += ' '
    }
    mergedText += result.text

    const offset = totalDuration
    const offsetWords = (result.words || []).map((w) => ({
      ...w,
      start: w.start + offset,
      end: w.end + offset,
    }))
    mergedWords = mergedWords.concat(offsetWords)

    totalDuration += result.duration || 0
  }

  return { text: mergedText, words: mergedWords, duration: totalDuration }
}
