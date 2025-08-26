export interface AIModel {
  id: string
  name: string
  provider: 'azure' | 'openai'
  model: string
  apiKey?: string
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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
  timestamp: string
  metadata?: {
    referencedFiles?: string[]
    tokenUsage?: number
  }
}

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

// Configuration stored in file (without sensitive data like API keys)
export interface AIConfig {
  models: Omit<AIModel, 'apiKey'>[]
  currentModelId: string | null
  options: AIOptions
}