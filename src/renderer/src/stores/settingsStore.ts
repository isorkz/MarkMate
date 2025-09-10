import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SettingsType = 'general' | 'appearance' | 'sync' | 'web' | 'ai'

interface GeneralSettings {
  
}

interface AppearanceSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
  sidebarVisible: boolean;
  sidebarWidth: number;
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
  width: number;
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
  updateAISettings: (settings: Partial<AISettings>) => void;
  toggleAIAssistant: () => void;
  toggleAIMaximize: () => void;
  resetSettings: () => void;
}

const defaultGeneralSettings: GeneralSettings = {
};

const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'light',
  fontSize: 14,
  fontFamily: 'Monaco, monospace',
  sidebarVisible: true,
  sidebarWidth: 288, // 18rem = 288px
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
  width: 320 // 20rem = 320px
};

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

      updateAISettings: (settings) => set(state => ({
        aiSettings: { ...state.aiSettings, ...settings }
      })),

      toggleAIAssistant: () => set(state => ({
        aiSettings: { ...state.aiSettings, isOpen: !state.aiSettings.isOpen }
      })),

      toggleAIMaximize: () => set(state => ({
        aiSettings: { ...state.aiSettings, isMaximized: !state.aiSettings.isMaximized }
      })),

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
        // aiSettings: state.aiSettings
      })
    }
  )
)