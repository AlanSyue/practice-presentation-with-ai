import axios from 'axios'

const SLIDES_API = 'https://slides.googleapis.com/v1/presentations'

export async function fetchPresentation(presentationId, accessToken) {
  const res = await axios.get(`${SLIDES_API}/${presentationId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.data
}

export async function fetchSlideThumbnail(presentationId, pageObjectId, accessToken) {
  const res = await axios.get(
    `${SLIDES_API}/${presentationId}/pages/${pageObjectId}/thumbnail`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return res.data.contentUrl
}

export function extractPresentationId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}
