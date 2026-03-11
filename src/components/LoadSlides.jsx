import { useState } from 'react'
import { fetchPresentation, fetchSlideThumbnail, extractPresentationId } from '../api/googleSlides'

export default function LoadSlides({ accessToken, onLoaded, onLogout }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [recentSlides, setRecentSlides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_slides') || '[]')
    } catch {
      return []
    }
  })

  function saveToRecent(url, title) {
    try {
      let recent = JSON.parse(localStorage.getItem('recent_slides') || '[]')
      // Remove duplicate
      recent = recent.filter((item) => item.url !== url)
      // Add to front
      recent.unshift({ url, title, loadedAt: new Date().toISOString() })
      // Keep max 10
      recent = recent.slice(0, 10)
      localStorage.setItem('recent_slides', JSON.stringify(recent))
      setRecentSlides(recent)
    } catch {
      // ignore localStorage errors
    }
  }

  const handleLoad = async () => {
    setError('')
    const presentationId = extractPresentationId(url)
    if (!presentationId) {
      setError('無效的 Google Slides URL')
      return
    }

    setLoading(true)
    try {
      const pres = await fetchPresentation(presentationId, accessToken)
      const activeSlides = pres.slides
        .map((s, i) => ({ ...s, originalIndex: i + 1 }))
        .filter(s => !s.slideProperties?.isSkipped)
      const thumbPromises = activeSlides.map((slide) =>
        fetchSlideThumbnail(presentationId, slide.objectId, accessToken)
      )
      const thumbs = await Promise.all(thumbPromises)
      setPreview({ presentation: { ...pres, slides: activeSlides }, thumbnails: thumbs })
      saveToRecent(url, pres.title)
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.error?.message || err.message || ''
      const isAuthError = status === 401 || status === 403
        || message.includes('authentication credentials')
        || message.includes('invalid_token')
        || message.includes('Token has been expired')
      if (isAuthError) {
        onLogout()
        return
      }
      setError(message || '載入投影片失敗，請確認 URL 和權限')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (preview) {
      onLoaded(preview.presentation, preview.thumbnails)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">載入投影片</h2>
          <button
            onClick={onLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            登出
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="貼上 Google Slides URL..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          />
          <button
            onClick={() => handleLoad()}
            disabled={loading || !url.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? '載入中...' : '載入'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {!preview && recentSlides.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">最近使用</h3>
            <div className="space-y-2">
              {recentSlides.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setUrl(item.url)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="font-medium text-gray-700 truncate">{item.title}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{item.url}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {preview && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">{preview.presentation.title}</h3>
            <p className="text-gray-500 text-sm mb-4">共 {preview.presentation.slides.length} 頁</p>

            <div className="grid grid-cols-3 gap-3 mb-6 max-h-80 overflow-y-auto">
              {preview.thumbnails.map((thumb, i) => (
                <div key={i} className="relative">
                  <img
                    src={thumb}
                    alt={`Slide ${i + 1}`}
                    className="w-full rounded border border-gray-200"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
            >
              開始錄音
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
