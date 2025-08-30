import * as fs from 'fs/promises'
import * as path from 'path'
import { createOpenAI } from '@ai-sdk/openai'
import { createAzure } from '@ai-sdk/azure'
import { streamText } from 'ai'
import { AIConfig, AIModel, ChatMessage, AIOptions, ChatSession, ChatSessionInfo } from '../types/ai'
import { AI_CONFIG_DIR, AI_CONFIG_FILE, AI_SESSIONS_DIR, DEFAULT_AI_CONFIG, DEFAULT_TEMPERATURE } from '../constants/ai'

export class AIService {
  /**
   * Read AI configuration
   */
  static async readConfig(workspacePath: string): Promise<AIConfig> {
    try {
      const fullPath = path.join(workspacePath, AI_CONFIG_DIR, AI_CONFIG_FILE)
      const data = await fs.readFile(fullPath, 'utf-8')
      const config = JSON.parse(data)
      
      // Get API key from environment variable
      const apiKeyFromEnv = process.env.MARKMATE_AI_KEY || ''
      
      // Merge API key into models for runtime use
      const modelsWithKeys = config.models.map(model => ({
        ...model,
        apiKey: apiKeyFromEnv
      }))
      
      return {
        ...config,
        models: modelsWithKeys
      } as AIConfig
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        // File doesn't exist - create default config
        console.log('AI config not found, creating default config')
        await this.writeConfig(workspacePath, DEFAULT_AI_CONFIG)
        return DEFAULT_AI_CONFIG
      } else {
        console.error('Error reading AI config:', error)
        throw error
      }
    }
  }

  /**
   * Write AI configuration to specified file path
   */
  static async writeConfig(workspacePath: string, config: AIConfig): Promise<void> {
    try {
      const fullPath = path.join(workspacePath, AI_CONFIG_DIR, AI_CONFIG_FILE)
      const dir = path.dirname(fullPath)
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true })
      
      // Create config without API keys for saving
      const configToSave = {
        ...config,
        models: config.models.map(model => {
          const { apiKey, ...modelWithoutKey } = model
          return modelWithoutKey
        })
      }
      
      await fs.writeFile(fullPath, JSON.stringify(configToSave, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error writing AI config:', error)
      throw error
    }
  }

  /**
   * Stream chat with AI model
   */
  static async *streamChat(
    model: AIModel,
    messages: ChatMessage[],
    options: AIOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Create AI provider and model instance
      let aiProvider
      
      switch (model.provider) {
        case 'openai':
          aiProvider = createOpenAI({
            apiKey: model.apiKey,
            ...(model.baseURL && { baseURL: model.baseURL })
          })
          break
        case 'azure':
          // https://ai-sdk.dev/providers/ai-sdk-providers/azure
          if (!model.baseURL) {
            throw new Error('Base URL is required for Azure OpenAI')
          }
          // Extract resource name from baseURL
          const resourceMatch = model.baseURL.match(/https:\/\/(.*?)\.openai\.azure\.com/)
          if (!resourceMatch) {
            throw new Error('Invalid Azure OpenAI baseURL format')
          }
          aiProvider = createAzure({
            resourceName: resourceMatch[1],
            apiKey: model.apiKey,
            // apiVersion: '2025-04-01-preview'  // https://learn.microsoft.com/en-us/azure/ai-foundry/openai/api-version-lifecycle?tabs=key
          })
          break
        default:
          throw new Error(`Unsupported provider: ${model.provider}`)
      }
      
      const aiModel = aiProvider.chat(model.model)

      // Format messages for AI SDK
      const formattedMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }))

      // Stream chat completion
      const result = await streamText({
        model: aiModel,
        messages: formattedMessages,
        temperature: options.temperature || DEFAULT_TEMPERATURE
      })

      // Yield text chunks as they arrive
      for await (const textPart of result.textStream) {
        yield textPart
      }
      
    } catch (error) {
      console.error('Error in AI chat stream:', error)
      throw error
    }
  }

  /**
   * Validate AI model configuration
   */
  static validateModel(model: AIModel): { isValid: boolean; error?: string } {
    if (!model.apiKey) {
      return { isValid: false, error: 'API key is required' }
    }

    if (!model.model) {
      return { isValid: false, error: 'Model name is required' }
    }

    if (model.provider === 'azure' && !model.baseURL) {
      return { isValid: false, error: 'Base URL is required for Azure OpenAI' }
    }

    return { isValid: true }
  }

  /**
   * Save a chat session to file
   */
  static async saveChatSession(workspacePath: string, session: ChatSession): Promise<void> {
    try {
      const sessionsDir = path.join(workspacePath, AI_CONFIG_DIR, AI_SESSIONS_DIR)
      await fs.mkdir(sessionsDir, { recursive: true })
      
      const sessionPath = path.join(sessionsDir, `${session.id}.json`)
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving chat session:', error)
      throw error
    }
  }

  /**
   * Load chat sessions list (without messages for performance)
   */
  static async loadChatSessions(workspacePath: string): Promise<ChatSessionInfo[]> {
    try {
      const sessionsDir = path.join(workspacePath, AI_CONFIG_DIR, AI_SESSIONS_DIR)
      await fs.mkdir(sessionsDir, { recursive: true })
      
      const files = await fs.readdir(sessionsDir)
      const sessionFiles = files.filter(file => file.endsWith('.json'))
      
      const sessions: ChatSessionInfo[] = []
      
      for (const file of sessionFiles) {
        try {
          const sessionPath = path.join(sessionsDir, file)
          const content = await fs.readFile(sessionPath, 'utf-8')
          const session = JSON.parse(content) as ChatSession
          
          // Return session without messages for performance
          sessions.push({
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          })
        } catch (error) {
          console.error(`Error reading session file ${file}:`, error)
        }
      }
      
      // Sort by updatedAt descending
      return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      throw error
    }
  }

  /**
   * Load a specific chat session with messages
   */
  static async loadChatSession(workspacePath: string, sessionId: string): Promise<ChatSession | null> {
    try {
      const sessionPath = path.join(workspacePath, AI_CONFIG_DIR, AI_SESSIONS_DIR, `${sessionId}.json`)
      
      const content = await fs.readFile(sessionPath, 'utf-8')
      return JSON.parse(content) as ChatSession
    } catch (error) {
      console.error('Error loading chat session:', error)
      throw error
    }
  }

  /**
   * Delete a chat session
   */
  static async deleteChatSession(workspacePath: string, sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(workspacePath, AI_CONFIG_DIR, AI_SESSIONS_DIR, `${sessionId}.json`)
      await fs.unlink(sessionPath)
    } catch (error) {
      console.error('Error deleting chat session:', error)
      throw error
    }
  }
}