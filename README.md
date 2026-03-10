# Google Slides Narrator

Record narration over Google Slides and automatically generate per-slide transcripts using OpenAI Whisper.

## Features

- Google OAuth login to access your Google Slides
- Load any Google Slides presentation by URL
- Record audio while navigating through slides (with pause/resume)
- Automatic speech-to-text transcription via OpenAI Whisper API
- Per-slide transcript aligned by page-turn timestamps
- Export results as JSON or TXT (includes slide content and speaker notes)

## Prerequisites

- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials
- An OpenAI API key (entered at runtime in the browser)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd slide-practice
npm install
```

### 2. Google Cloud configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Google Slides API**: APIs & Services → Library → search "Google Slides API" → Enable
4. Set up OAuth consent screen: Google Auth Platform → Branding → fill in App name and email → save
5. Configure audience: Google Auth Platform → Audience → set to External / Testing → add your Gmail as a test user
6. Create OAuth credentials: Google Auth Platform → Clients → Create → Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
7. Copy the generated **Client ID**

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Google OAuth Client ID:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

> The OpenAI API Key is entered by the user in the browser and stored in localStorage. It is not required in `.env`.

## Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. Enter your OpenAI API Key and sign in with Google
2. Paste a Google Slides URL and load the presentation
3. Click "Start Recording" to begin
4. Navigate slides with the prev/next buttons while narrating
5. Click "Stop Recording" when done — the audio is sent to Whisper for transcription
6. View per-slide transcripts and download as JSON or TXT

## Tech Stack

- React + Vite
- TailwindCSS v4
- @react-oauth/google
- Google Slides API v1
- Web MediaRecorder API
- OpenAI Whisper API
