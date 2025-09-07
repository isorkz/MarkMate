import { ipcMain } from 'electron'
import { AIPersistService } from '../../shared/services'
import { ChatSession, AIConfig } from '../../shared/types/ai'

export function setupAIHandlers() {
  // Read AI configuration
  ipcMain.handle('ai-config:read', async (_, workspacePath: string) => {
    try {
      return await AIPersistService.readConfig(workspacePath)
    } catch (error) {
      console.error('Error reading AI config:', error)
      throw error
    }
  })

  // Write AI configuration
  ipcMain.handle('ai-config:write', async (_, workspacePath: string, config: AIConfig) => {
    try {
      await AIPersistService.writeConfig(workspacePath, config)
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
      await AIPersistService.saveChatSession(workspacePath, session)
    } catch (error) {
      console.error('Error saving chat session:', error)
      throw error
    }
  })

  // Load chat sessions list
  ipcMain.handle('ai-session:load-list', async (_, workspacePath: string) => {
    try {
      return await AIPersistService.loadChatSessions(workspacePath)
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      throw error
    }
  })

  // Load specific chat session
  ipcMain.handle('ai-session:load', async (_, workspacePath: string, sessionId: string) => {
    try {
      return await AIPersistService.loadChatSession(workspacePath, sessionId)
    } catch (error) {
      console.error('Error loading chat session:', error)
      throw error
    }
  })

  // Delete chat session
  ipcMain.handle('ai-session:delete', async (_, workspacePath: string, sessionId: string) => {
    try {
      await AIPersistService.deleteChatSession(workspacePath, sessionId)
    } catch (error) {
      console.error('Error deleting chat session:', error)
      throw error
    }
  })
}