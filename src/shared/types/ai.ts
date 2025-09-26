export interface AIModel {
  id: string
  name: string
  provider: 'openai'
  model: string
  apiKey: string
  baseURL?: string
}

export interface MultimodalContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: ImageUrl
}

export interface ImageUrl {
  url: string
  detail?: 'low' | 'high' | 'auto'
}

export type MessageContent = string | MultimodalContent[]

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: MessageContent
  timestamp: string
  metadata?: {
    referencedFiles?: string[]
    tokenUsage?: number
  }
}

export type ChatSessionInfo = Omit<ChatSession, 'messages'>

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface AIOptions {
  temperature?: number
  maxTokens?: number
}

export interface AIConfig {
  models: AIModel[]
  currentModelId: string | null
  options: AIOptions
}