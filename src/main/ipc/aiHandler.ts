import { ipcMain } from 'electron'
import { AIService } from '../../shared/services'
import { AIModel, ChatMessage, AIOptions, ChatSession, AIConfig } from '../../shared/types/ai'

export function setupAIHandlers() {
  // Read AI configuration
  ipcMain.handle('ai-config:read', async (_, workspacePath: string) => {
    try {
      return await AIService.readConfig(workspacePath)
    } catch (error) {
      console.error('Error reading AI config:', error)
      throw error
    }
  })

  // Write AI configuration
  ipcMain.handle('ai-config:write', async (_, workspacePath: string, config: AIConfig) => {
    try {
      await AIService.writeConfig(workspacePath, config)
      return true
    } catch (error) {
      console.error('Error writing AI config:', error)
      throw error
    }
  })

  // Set environment variable API key
  ipcMain.handle('ai-config:set-ai-key', (_, apiKey: string) => {
    try {
      process.env.MARKMATE_AI_KEY = apiKey
    } catch (error) {
      console.error('Error setting AI key to environment variable:', error)
      throw error
    }
  })

  // Save chat session
  ipcMain.handle('ai-session:save', async (_, workspacePath: string, session: ChatSession) => {
    try {
      await AIService.saveChatSession(workspacePath, session)
    } catch (error) {
      console.error('Error saving chat session:', error)
      throw error
    }
  })

  // Load chat sessions list
  ipcMain.handle('ai-session:load-list', async (_, workspacePath: string) => {
    try {
      return await AIService.loadChatSessions(workspacePath)
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      throw error
    }
  })

  // Load specific chat session
  ipcMain.handle('ai-session:load', async (_, workspacePath: string, sessionId: string) => {
    try {
      return await AIService.loadChatSession(workspacePath, sessionId)
    } catch (error) {
      console.error('Error loading chat session:', error)
      throw error
    }
  })

  // Delete chat session
  ipcMain.handle('ai-session:delete', async (_, workspacePath: string, sessionId: string) => {
    try {
      await AIService.deleteChatSession(workspacePath, sessionId)
    } catch (error) {
      console.error('Error deleting chat session:', error)
      throw error
    }
  })

  // Validate AI model configuration
  ipcMain.handle('ai-chat:validate-model', (_, model: AIModel) => {
    try {
      return AIService.validateModel(model)
    } catch (error) {
      console.error('Error validating AI model:', error)
      return { isValid: false, error: 'Validation failed' }
    }
  })

  // Stream chat with AI
  ipcMain.handle('ai-chat:stream', async (event, streamId: string, model: AIModel, messages: ChatMessage[], options: AIOptions) => {
    try {
      // Validate model configuration
      const validation = AIService.validateModel(model)
      if (!validation.isValid) {
        event.sender.send('ai-chat:stream-chunk', { id: streamId, error: validation.error })
        return
      }

      // Get stream from AIService
      const { stream } = await AIService.streamChatForElectron(model, messages, options)
      
      // Stream chunks to renderer
      for await (const chunk of stream) {
        event.sender.send('ai-chat:stream-chunk', { id: streamId, chunk })
      }
      
      // Signal completion
      event.sender.send('ai-chat:stream-chunk', { id: streamId, complete: true })
      
    } catch (error) {
      console.error('Error in AI chat stream:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      event.sender.send('ai-chat:stream-chunk', { id: streamId, error: errorMessage })
    }
  })
}