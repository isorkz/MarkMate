import { AIConfig, ChatSession } from '../../../shared/types/ai'
import { adapters } from '../adapters'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useAIStore } from '../stores/aiStore'

/**
 * Set environment variable with default model's API key
 */
export const setAIKeyToEnv = async (config: AIConfig) => {
  try {
    const defaultModel = config.models.find(model => model.id === config.currentModelId)
    if (defaultModel?.apiKey && defaultModel.apiKey.trim() !== '') {
      await adapters.aiAdapter.setAIKey(defaultModel.apiKey)
    }
  } catch (error) {
    console.error('Failed to set AI key to environment:', error)
    throw error
  }
}

/**
 * Save AI config to file
 */
export const persistAIConfig = async (config: AIConfig, needSetAIKeyToEnv: boolean) => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    // Won't save keys to file for security reasons
    await adapters.aiAdapter.writeConfig(workspacePath, config)

    if (needSetAIKeyToEnv) {
      await setAIKeyToEnv(config)
    }
  } catch (error) {
    console.error('Failed to save AI config to file:', error)
    throw error
  }
}

/**
 * Load AI config from file
 */
export const loadAIConfigFromFile = async () => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    const config = await adapters.aiAdapter.readConfig(workspacePath)
    
    useAIStore.setState((state) => ({
      ...state,
      config
    }))
  } catch (error) {
    console.error('Failed to load AI configs from file:', error)
    throw error
  }
}

/**
 * Save current chat session to file
 */
export const saveCurrentSession = async (chatSession: ChatSession) => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    await adapters.aiAdapter.saveChatSession(workspacePath, chatSession)
  } catch (error) {
    console.error('Failed to save session:', error)
    throw error
  }
}

/**
 * Load chat sessions list from file
 */
export const loadChatSessions = async () => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    const sessions = await adapters.aiAdapter.loadChatSessions(workspacePath)
    
    useAIStore.setState((state) => ({
      ...state,
      sessions
    }))
  } catch (error) {
    console.error('Failed to load chat sessions:', error)
    throw error
  }
}