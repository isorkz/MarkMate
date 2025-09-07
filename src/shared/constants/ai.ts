import { AIConfig } from '../types/ai'

// AI configuration file paths
export const AI_CONFIG_DIR = '.ai'
export const AI_CONFIG_FILE = 'config.json'
export const AI_SESSIONS_DIR = 'sessions'

// Default AI options
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MAX_TOKENS = 204800

// Default AI configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  models: [],
  currentModelId: null,
  options: {
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS
  }
}

export const DEFAULT_CHAT_TITLE = 'New Chat'