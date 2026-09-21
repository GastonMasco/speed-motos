import { GoogleGenerativeAI } from '@google/generative-ai'

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

export const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
  if (!geminiApiKey) {
    throw new Error('API Key de Gemini no configurada. Agrega VITE_GEMINI_API_KEY en tu archivo .env')
  }
  const genAI = new GoogleGenerativeAI(geminiApiKey)
  return genAI.getGenerativeModel({ model: modelName })
}
