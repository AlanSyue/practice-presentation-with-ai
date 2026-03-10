import { formatTime, exportAsJSON, exportAsTXT } from '../utils/alignTranscript'

export default function ResultScreen({
  transcriptResult,
  recordingResult,
  presentation,
  thumbnails,
  onStartOver,
}) {
  const title = presentation?.title || 'Untitled'
  const totalDuration = recordingResult?.totalDuration || 0

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-1">{title}</h2>
          <p className="text-gray-500">
            總時長：{formatTime(totalDuration)} ・ {transcriptResult.length} 頁
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => exportAsJSON(title, transcriptResult, totalDuration)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              下載 JSON
            </button>
            <button
              onClick={() => exportAsTXT(title, transcriptResult, totalDuration)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
            >
              下載 TXT
            </button>
            <button
              onClick={onStartOver}
              className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer ml-auto"
            >
              重新開始
            </button>
          </div>
        </div>

        {/* Slide cards */}
        <div className="space-y-4">
          {transcriptResult.map((slide, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 flex gap-4">
              {thumbnails[slide.slideIndex - 1] && (
                <img
                  src={thumbnails[slide.slideIndex - 1]}
                  alt={`Slide ${i + 1}`}
                  className="w-40 h-auto rounded border border-gray-200 shrink-0 self-start"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">第 {slide.slideIndex} 頁</span>
                  <span className="text-xs text-gray-400">
                    {slide.startTime} ・ 時長 {slide.duration}
                  </span>
                </div>
                {slide.slideContent && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-blue-500">投影片內容</span>
                    <p className="text-gray-500 text-xs leading-relaxed whitespace-pre-wrap mt-0.5">{slide.slideContent}</p>
                  </div>
                )}
                {slide.speakerNotes && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-amber-500">講者備註</span>
                    <p className="text-gray-500 text-xs leading-relaxed whitespace-pre-wrap mt-0.5">{slide.speakerNotes}</p>
                  </div>
                )}
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {slide.transcript || '（無語音內容）'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
