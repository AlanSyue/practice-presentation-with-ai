// Extract all text content from a slide's page elements
function extractSlideText(slide) {
  if (!slide?.pageElements) return ''
  const texts = []
  for (const el of slide.pageElements) {
    if (el.shape?.text?.textElements) {
      for (const te of el.shape.text.textElements) {
        if (te.textRun?.content) {
          texts.push(te.textRun.content.trim())
        }
      }
    }
    if (el.table) {
      for (const row of el.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          if (cell.text?.textElements) {
            for (const te of cell.text.textElements) {
              if (te.textRun?.content) {
                texts.push(te.textRun.content.trim())
              }
            }
          }
        }
      }
    }
  }
  return texts.filter(Boolean).join('\n')
}

// Extract speaker notes from a slide
function extractSpeakerNotes(slide) {
  const notesPage = slide?.slideProperties?.notesPage
  if (!notesPage?.pageElements) return ''
  const texts = []
  for (const el of notesPage.pageElements) {
    if (el.shape?.shapeType === 'TEXT_BOX' && el.shape?.text?.textElements) {
      for (const te of el.shape.text.textElements) {
        if (te.textRun?.content) {
          texts.push(te.textRun.content.trim())
        }
      }
    }
  }
  return texts.filter(Boolean).join('\n')
}

export function alignTranscriptToSlides(whisperResult, slideTimestamps, totalDuration, presentation = null) {
  const slides = slideTimestamps.map((item, i) => {
    const nextTimestamp = slideTimestamps[i + 1]?.timestamp ?? totalDuration
    return {
      slideIndex: item.slideIndex,
      startTime: item.timestamp,
      endTime: nextTimestamp,
      duration: nextTimestamp - item.timestamp,
    }
  })

  const words = whisperResult.words || []

  const presentationSlides = presentation?.slides || []

  return slides.map((slide) => {
    const slideWords = words
      .filter((w) => w.start >= slide.startTime && w.start < slide.endTime)
      .map((w) => w.word)
      .join('')

    const presSlide = presentationSlides[slide.slideIndex]

    return {
      slideIndex: presSlide?.originalIndex ?? (slide.slideIndex + 1),
      startTime: formatTime(slide.startTime),
      endTime: formatTime(slide.endTime),
      duration: formatTime(slide.duration),
      slideContent: presSlide ? extractSlideText(presSlide) : '',
      speakerNotes: presSlide ? extractSpeakerNotes(presSlide) : '',
      transcript: slideWords.trim(),
    }
  })
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

export function exportAsJSON(title, slides, totalDuration) {
  const data = {
    title,
    recordedAt: new Date().toISOString(),
    totalDuration: formatTime(totalDuration),
    slides: slides.map((s) => ({
      slideIndex: s.slideIndex,
      startTime: s.startTime,
      duration: s.duration,
      slideContent: s.slideContent,
      speakerNotes: s.speakerNotes,
      transcript: s.transcript,
    })),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${title || 'transcript'}.json`)
}

export function exportAsTXT(title, slides, totalDuration) {
  let text = `總時長：${formatTime(totalDuration)}\n錄音日期：${new Date().toLocaleDateString()}\n\n`
  slides.forEach((s) => {
    text += '========================================\n'
    text += `第 ${s.slideIndex} 頁\n`
    text += `開始時間：${s.startTime}｜時長：${s.duration}\n`
    text += '----------------------------------------\n'
    if (s.slideContent) {
      text += `【投影片內容】\n${s.slideContent}\n\n`
    }
    if (s.speakerNotes) {
      text += `【講者備註】\n${s.speakerNotes}\n\n`
    }
    text += `【逐字稿】\n${s.transcript || '（無語音內容）'}\n\n`
  })
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `${title || 'transcript'}.txt`)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
