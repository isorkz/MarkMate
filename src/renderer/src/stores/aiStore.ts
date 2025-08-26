import { create } from 'zustand'
import { AIModel, AIConfig, AIOptions } from '../../../shared/types/ai'
import { AI_CONFIG_PATH, DEFAULT_AI_CONFIG } from '../../../shared/constants/ai'
import { adapters } from '../adapters'
import { useWorkspaceStore } from './workspaceStore'

interface AIStore {
  config: AIConfig
  
  // Loading state
  isLoading: boolean
  
  // Actions
  addModel: (model: Omit<AIModel, 'id'>) => Promise<void>
  updateModel: (id: string, model: Partial<AIModel>) => Promise<void>
  deleteModel: (id: string) => Promise<void>
  setDefaultModel: (id: string) => Promise<void>
  updateOptions: (options: Partial<AIOptions>) => Promise<void>
}

// Internal function to save AI config to file
const saveAIConfigToFile = async (config: AIConfig) => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    // Create config without API keys for saving
    const configToSave = {
      ...config,
      models: config.models.map(model => {
        const { apiKey, ...modelWithoutKey } = model as AIModel
        return modelWithoutKey
      })
    }
    
    await adapters.aiAdapter.writeConfig(workspacePath, AI_CONFIG_PATH, configToSave)
  } catch (error) {
    console.error('Failed to save AI config to file:', error)
    throw error
  }
}

// Internal function to load AI config from file
const loadAIConfigFromFile = async () => {
  // Set loading state
  useAIStore.setState({ isLoading: true })
  
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) {
      useAIStore.setState({ isLoading: false })
      return
    }
    
    const config = await adapters.aiAdapter.readConfig(workspacePath, AI_CONFIG_PATH)
    const envApiKey = await adapters.aiAdapter.getAIKey()
    
    // Merge API key into models for runtime use
    const modelsWithKeys = config.models.map(model => ({
      ...model,
      apiKey: envApiKey || undefined
    }))
    
    // Update store with loaded config
    useAIStore.setState({
      config: {
        ...config,
        models: modelsWithKeys as any // AIModel[] with apiKey for runtime
      },
      isLoading: false
    })
  } catch (error) {
    console.error('Failed to load AI configs from file:', error)
    useAIStore.setState({ isLoading: false })
  }
}

export const useAIStore = create<AIStore>((set, get) => ({
  // Initial state
  config: DEFAULT_AI_CONFIG,
  isLoading: false,
  
  // Add a new AI model
  addModel: async (model) => {
    const state = get()
    const newModel: AIModel = {
      ...model,
      id: `model-${Date.now()}`
    }
    
    const updatedModels = [...state.config.models, newModel] as AIModel[]
    const updatedCurrentModelId = state.config.models.length === 0 ? newModel.id : state.config.currentModelId
    
    const updatedConfig = {
      ...state.config,
      models: updatedModels,
      currentModelId: updatedCurrentModelId
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await saveAIConfigToFile(updatedConfig)
  },
  
  // Update an existing AI model
  updateModel: async (id, modelUpdate) => {
    const state = get()
    const updatedModels = (state.config.models as AIModel[]).map(model => 
      model.id === id ? { ...model, ...modelUpdate } : model
    )
    
    const updatedConfig = {
      ...state.config,
      models: updatedModels
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await saveAIConfigToFile(updatedConfig)
  },
  
  // Delete an AI model
  deleteModel: async (id) => {
    const state = get()
    const updatedModels = (state.config.models as AIModel[]).filter(model => model.id !== id)
    let updatedCurrentModelId = state.config.currentModelId
    
    // If deleting current model, set first remaining model as current
    if (updatedCurrentModelId === id) {
      updatedCurrentModelId = updatedModels.length > 0 ? updatedModels[0].id : null
    }
    
    const updatedConfig = {
      ...state.config,
      models: updatedModels,
      currentModelId: updatedCurrentModelId
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await saveAIConfigToFile(updatedConfig)
  },
  
  // Set default model
  setDefaultModel: async (id) => {
    const state = get()
    const updatedConfig = {
      ...state.config,
      currentModelId: id
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await saveAIConfigToFile(updatedConfig)
  },
  
  // Update AI options (temperature, maxTokens)
  updateOptions: async (optionUpdates) => {
    const state = get()
    const updatedOptions = { ...state.config.options, ...optionUpdates }
    const updatedConfig = {
      ...state.config,
      options: updatedOptions
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await saveAIConfigToFile(updatedConfig)
  }
}))

// Initialize AIStore by loading config when module is imported
loadAIConfigFromFile()