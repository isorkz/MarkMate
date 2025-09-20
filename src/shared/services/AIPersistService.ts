import * as fs from 'fs/promises'
import * as path from 'path'
import { AIConfig, ChatSession, ChatSessionInfo } from '../types/ai'
import { AI_CONFIG_DIR, AI_CONFIG_FILE, AI_SESSIONS_DIR, DEFAULT_AI_CONFIG } from '../constants/ai'
import { CryptoService } from './CryptoService'

export class AIPersistService {
  /**
   * Read AI configuration
   */
  static async readConfig(workspacePath: string): Promise<AIConfig> {
    try {
      const fullPath = path.join(workspacePath, AI_CONFIG_DIR, AI_CONFIG_FILE)
      const data = await fs.readFile(fullPath, 'utf-8')
      const config = JSON.parse(data)
      
      // Get master password from environment variable
      const masterPassword = process.env.MARKMATE_MASTER_PASSWORD
      
      if (!masterPassword) {
        throw new Error('MARKMATE_MASTER_PASSWORD environment variable is required')
      }
      
      // Decrypt stored API keys
      const modelsWithKeys = config.models.map(model => ({
        ...model,
        apiKey: model.apiKey ? CryptoService.decrypt(model.apiKey, masterPassword) : ''
      }))
      
      return {
        ...config,
        models: modelsWithKeys
      } as AIConfig
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
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
      
      // Get master password from environment variable
      const masterPassword = process.env.MARKMATE_MASTER_PASSWORD
      
      if (!masterPassword) {
        throw new Error('MARKMATE_MASTER_PASSWORD environment variable is required')
      }
      
      // Create config with encrypted API keys for saving
      const configToSave = {
        ...config,
        models: config.models.map(model => ({
          ...model,
          apiKey: model.apiKey ? CryptoService.encrypt(model.apiKey, masterPassword) : ''
        }))
      }
      
      await fs.writeFile(fullPath, JSON.stringify(configToSave, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error writing AI config:', error)
      throw error
    }
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