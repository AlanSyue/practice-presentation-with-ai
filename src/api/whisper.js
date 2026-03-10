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

export async function transcribeAudio(audioBlob, openaiApiKey) {
  const ext = getExtension(audioBlob.type)
  const formData = new FormData()
  formData.append('file', audioBlob, `recording.${ext}`)
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
