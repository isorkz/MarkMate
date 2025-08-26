import { ipcMain } from 'electron'
import { AIService } from '../../shared/services'

export function setupAIHandlers() {
  // Read AI configuration
  ipcMain.handle('ai-config:read', async (_, workspacePath: string, configFilePath: string) => {
    try {
      return await AIService.readConfig(workspacePath, configFilePath)
    } catch (error) {
      console.error('Error reading AI config:', error)
      throw error
    }
  })

  // Write AI configuration
  ipcMain.handle('ai-config:write', async (_, workspacePath: string, configFilePath: string, config: any) => {
    try {
      await AIService.writeConfig(workspacePath, configFilePath, config)
      return true
    } catch (error) {
      console.error('Error writing AI config:', error)
      throw error
    }
  })

  // Get environment variable API key
  ipcMain.handle('ai-config:get-ai-key', () => {
    try {
      return process.env.MARKMATE_AI_KEY || null
    } catch (error) {
      console.error('Error getting AI key from environment variable:', error)
      throw error
    }
  })
}