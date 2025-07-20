import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SettingsType = 'general' | 'appearance' | 'sync'

interface GeneralSettings {
  autoSaveEnabled: boolean;
  autoSaveDelayInSeconds: number;
}

interface AppearanceSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
  sidebarVisible: boolean;
}

interface SyncSettings {
  autoSyncEnabled: boolean;
  autoSyncDelayInSeconds: number;
  gitUsername: string;
  gitEmail: string;
  gitRemoteUrl: string;
}

interface SettingsStore {
  generalSettings: GeneralSettings;
  appearanceSettings: AppearanceSettings;
  syncSettings: SyncSettings;
  
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
  resetSettings: () => void;
}

const defaultGeneralSettings: GeneralSettings = {
  autoSaveEnabled: true,
  autoSaveDelayInSeconds: 10
};

const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'light',
  fontSize: 14,
  fontFamily: 'Monaco, monospace',
  sidebarVisible: true,
};

const defaultSyncSettings: SyncSettings = {
  autoSyncEnabled: true,
  autoSyncDelayInSeconds: 300, // 5 minutes
  gitUsername: '',
  gitEmail: '',
  gitRemoteUrl: ''
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      generalSettings: defaultGeneralSettings,
      appearanceSettings: defaultAppearanceSettings,
      syncSettings: defaultSyncSettings,
      
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
      
      resetSettings: () => set({ 
        generalSettings: defaultGeneralSettings, 
        appearanceSettings: defaultAppearanceSettings, 
        syncSettings: defaultSyncSettings 
      })
    }),
    {
      name: 'settings-storage'
    }
  )
)