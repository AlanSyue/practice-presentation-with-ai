import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'

export default function LoginScreen({ onLogin, savedApiKey }) {
  const [apiKey, setApiKey] = useState(savedApiKey || '')
  const [error, setError] = useState('')

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (!apiKey.trim()) {
        setError('請輸入 OpenAI API Key')
        return
      }
      onLogin(tokenResponse.access_token, apiKey.trim())
    },
    onError: () => setError('Google 登入失敗，請重試'),
    scope: 'https://www.googleapis.com/auth/presentations.readonly',
  })

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Google Slides Narrator</h1>
        <p className="text-gray-500 text-center mb-8">錄製投影片語音，自動產出逐字稿</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">用於將錄音透過 Whisper API 轉譯為逐字稿，僅儲存在瀏覽器 localStorage，不會傳送到其他伺服器</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          onClick={login}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          使用 Google 帳號登入
        </button>
      </div>
    </div>
  )
}
