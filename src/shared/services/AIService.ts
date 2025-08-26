import * as fs from 'fs/promises'
import * as path from 'path'
import { AIConfig } from '../types/ai'
import { DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '../constants/ai'

const DEFAULT_AI_CONFIG: AIConfig = {
  models: [],
  currentModelId: null,
  options: {
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS
  }
}

export class AIService {
  /**
   * Read AI configuration from specified file path
   */
  static async readConfig(workspacePath: string, configFilePath: string): Promise<AIConfig> {
    try {
      const fullPath = path.join(workspacePath, configFilePath)
      const data = await fs.readFile(fullPath, 'utf-8')
      return JSON.parse(data) as AIConfig
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        // File doesn't exist - create default config
        console.log('AI config not found, creating default config')
        await this.writeConfig(workspacePath, configFilePath, DEFAULT_AI_CONFIG)
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
  static async writeConfig(workspacePath: string, configFilePath: string, config: AIConfig): Promise<void> {
    try {
      const fullPath = path.join(workspacePath, configFilePath)
      const dir = path.dirname(fullPath)
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(fullPath, JSON.stringify(config, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error writing AI config:', error)
      throw error
    }
  }

  /**
   * Check if AI configuration file exists
   */
  static async configExists(workspacePath: string, configFilePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(workspacePath, configFilePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }
}