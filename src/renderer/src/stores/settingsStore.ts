import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  sidebarVisible: boolean;
}

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (path: string, value: any) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  fontSize: 14,
  fontFamily: 'Monaco, monospace',
  sidebarVisible: true
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      
      updateSettings: (path, value) => {
        const keys = path.split('.');
        set(state => {
          const newSettings = { ...state.settings };
          let current = newSettings;
          
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]] = { ...current[keys[i]] };
          }
          
          current[keys[keys.length - 1]] = value;
          return { settings: newSettings };
        });
      },
      
      resetSettings: () => set({ settings: defaultSettings })
    }),
    {
      name: 'settings-storage'
    }
  )
)