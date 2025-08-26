import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIModel, AIConfig, AIOptions } from '../../../shared/types/ai'
import { AI_CONFIG_PATH, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '../../../shared/constants/ai'
import { adapters } from '../adapters'
import { useWorkspaceStore } from './workspaceStore'

export type SettingsType = 'general' | 'appearance' | 'sync' | 'web' | 'ai'

interface GeneralSettings {
  
}

interface AppearanceSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
  sidebarVisible: boolean;
}

interface SyncSettings {
  autoSaveEnabled: boolean;
  autoSaveDelayInSeconds: number;
  autoSyncEnabled: boolean;
  autoSyncDelayInSeconds: number;
  gitUsername: string;
  gitEmail: string;
  gitRemoteUrl: string;
}

interface WebSettings {
  accessToken: string;
}

interface AISettings {
  isOpen: boolean;
  isMaximized: boolean;
  models: AIModel[];
  currentModelId: string | null;
  options: AIOptions;
}

interface SettingsStore {
  generalSettings: GeneralSettings;
  appearanceSettings: AppearanceSettings;
  syncSettings: SyncSettings;
  webSettings: WebSettings;
  aiSettings: AISettings;
  
  // UI state
  isOpen: boolean;
  activeSettings: SettingsType;
  
  // Actions
  openSettings: (type: SettingsType) => void;
  closeSettings: () => void;
  setActiveSettings: (type: SettingsType) => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;
  updateSyncSettings: (settings: Partial<SyncSettings>) => void;
  updateWebSettings: (settings: Partial<WebSettings>) => void;
  updateAISettings: (settings: Partial<AISettings>) => Promise<void>;
  toggleAIAssistant: () => void;
  toggleAIMaximize: () => void;
  addAIModel: (model: Omit<AIModel, 'id'>) => Promise<void>;
  updateAIModel: (id: string, model: Partial<AIModel>) => Promise<void>;
  deleteAIModel: (id: string) => Promise<void>;
  setDefaultAIModel: (id: string) => Promise<void>;
  resetSettings: () => void;
}

const defaultGeneralSettings: GeneralSettings = {
};

const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'light',
  fontSize: 14,
  fontFamily: 'Monaco, monospace',
  sidebarVisible: true,
};

const defaultSyncSettings: SyncSettings = {
  autoSaveEnabled: true,
  autoSaveDelayInSeconds: 10,
  autoSyncEnabled: true,
  autoSyncDelayInSeconds: 300, // 5 minutes
  gitUsername: '',
  gitEmail: '',
  gitRemoteUrl: ''
};

const defaultWebSettings: WebSettings = {
  accessToken: ''
};

const defaultAISettings: AISettings = {
  isOpen: false,
  isMaximized: false,
  models: [],
  currentModelId: null,
  options: {
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS
  }
};

// Helper function to save AI config to file
const saveAIConfig = async (models: AIModel[], currentModelId: string | null, options: AIOptions) => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    // Remove apiKey from models before saving
    const configModels = models.map(model => {
      const { apiKey, ...modelWithoutKey } = model
      return modelWithoutKey
    })
    
    const config: AIConfig = {
      models: configModels,
      currentModelId,
      options
    }
    
    await adapters.aiAdapter.writeConfig(workspacePath, AI_CONFIG_PATH, config)
  } catch (error) {
    console.error('Failed to save AI config:', error)
    throw error
  }
}

// Load AI config from file and merge with store
const loadAIConfigIntoStore = async () => {
  try {
    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return
    
    const config = await adapters.aiAdapter.readConfig(workspacePath, AI_CONFIG_PATH)
    const envApiKey = await adapters.aiAdapter.getAIKey()
    
    // Merge API key into models
    const modelsWithKeys = config.models.map(model => ({
      ...model,
      apiKey: envApiKey || undefined
    }))
    
    // Update the store with loaded config
    useSettingsStore.getState().updateAISettings({
      models: modelsWithKeys,
      currentModelId: config.currentModelId,
      options: config.options
    })
  } catch (error) {
    console.log('Failed to load AI configs:', error)
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      generalSettings: defaultGeneralSettings,
      appearanceSettings: defaultAppearanceSettings,
      syncSettings: defaultSyncSettings,
      webSettings: defaultWebSettings,
      aiSettings: defaultAISettings,
      
      // UI state
      isOpen: false,
      activeSettings: 'general',
      
      // Actions
      openSettings: (type) => set({ isOpen: true, activeSettings: type }),
      closeSettings: () => set({ isOpen: false }),
      setActiveSettings: (type) => set({ activeSettings: type }),
      
      updateGeneralSettings: (settings) => set(state => ({
        generalSettings: { ...state.generalSettings, ...settings }
      })),

      updateAppearanceSettings: (settings) => set(state => ({
        appearanceSettings: { ...state.appearanceSettings, ...settings }
      })),
      
      updateSyncSettings: (settings) => set(state => ({
        syncSettings: { ...state.syncSettings, ...settings }
      })),

      updateWebSettings: (settings) => set(state => ({
        webSettings: { ...state.webSettings, ...settings }
      })),

      updateAISettings: async (settings) => {
        const state = useSettingsStore.getState()
        const updatedAISettings = { ...state.aiSettings, ...settings }
        
        set({
          aiSettings: updatedAISettings
        })
        
        // Save to config file if options changed
        if (settings.options) {
          await saveAIConfig(updatedAISettings.models, updatedAISettings.currentModelId, updatedAISettings.options)
        }
      },

      toggleAIAssistant: () => set(state => ({
        aiSettings: { ...state.aiSettings, isOpen: !state.aiSettings.isOpen }
      })),

      toggleAIMaximize: () => set(state => ({
        aiSettings: { ...state.aiSettings, isMaximized: !state.aiSettings.isMaximized }
      })),

      addAIModel: async (model) => {
        const state = useSettingsStore.getState()
        const newModel: AIModel = {
          ...model,
          id: `model-${Date.now()}`
        }
        
        const updatedModels = [...state.aiSettings.models, newModel]
        const updatedCurrentModelId = state.aiSettings.models.length === 0 ? newModel.id : state.aiSettings.currentModelId
        
        // Update store
        set({
          aiSettings: {
            ...state.aiSettings,
            models: updatedModels,
            currentModelId: updatedCurrentModelId
          }
        })
        
        // Save to config file
        await saveAIConfig(updatedModels, updatedCurrentModelId, state.aiSettings.options)
      },

      updateAIModel: async (id, modelUpdate) => {
        const state = useSettingsStore.getState()
        const updatedModels = state.aiSettings.models.map(model => 
          model.id === id ? { ...model, ...modelUpdate } : model
        )
        
        // Update store
        set({
          aiSettings: {
            ...state.aiSettings,
            models: updatedModels
          }
        })
        
        // Save to config file
        await saveAIConfig(updatedModels, state.aiSettings.currentModelId, state.aiSettings.options)
      },

      deleteAIModel: async (id) => {
        const state = useSettingsStore.getState()
        const updatedModels = state.aiSettings.models.filter(model => model.id !== id)
        let updatedCurrentModelId = state.aiSettings.currentModelId
        
        // If deleting current model, set first remaining model as current
        if (updatedCurrentModelId === id) {
          updatedCurrentModelId = updatedModels.length > 0 ? updatedModels[0].id : null
        }
        
        // Update store
        set({
          aiSettings: {
            ...state.aiSettings,
            models: updatedModels,
            currentModelId: updatedCurrentModelId
          }
        })
        
        // Save to config file
        await saveAIConfig(updatedModels, updatedCurrentModelId, state.aiSettings.options)
      },

      setDefaultAIModel: async (id) => {
        const state = useSettingsStore.getState()
        
        // Update store - only change currentModelId
        set({
          aiSettings: {
            ...state.aiSettings,
            currentModelId: id
          }
        })
        
        // Save to config file
        await saveAIConfig(state.aiSettings.models, id, state.aiSettings.options)
      },
      
      resetSettings: () => set({ 
        generalSettings: defaultGeneralSettings, 
        appearanceSettings: defaultAppearanceSettings, 
        syncSettings: defaultSyncSettings,
        aiSettings: defaultAISettings
      })
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        generalSettings: state.generalSettings,
        appearanceSettings: state.appearanceSettings,
        syncSettings: {
          autoSaveEnabled: state.syncSettings.autoSaveEnabled,
          autoSaveDelayInSeconds: state.syncSettings.autoSaveDelayInSeconds,
          autoSyncEnabled: state.syncSettings.autoSyncEnabled,
          autoSyncDelayInSeconds: state.syncSettings.autoSyncDelayInSeconds,
          // Git credentials are excluded from persistence
          gitUsername: '',
          gitEmail: '',
          gitRemoteUrl: ''
        },
        webSettings: state.webSettings,
        // AI settings: only persist UI state, models/options are loaded from config file
        aiSettings: {
          isOpen: state.aiSettings.isOpen,
          isMaximized: state.aiSettings.isMaximized,
          // models: [], // Will be loaded from config file
          // currentModelId: null, // Will be loaded from config file
          // options: { temperature: DEFAULT_TEMPERATURE, maxTokens: DEFAULT_MAX_TOKENS } // Will be loaded from config file
        }
      })
    }
  )
)

// Load AI config when store is initialized
loadAIConfigIntoStore()