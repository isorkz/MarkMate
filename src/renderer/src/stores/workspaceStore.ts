import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceSettings {
  autoSave: boolean;
  autoSaveDelay: number;
  gitAutoCommit: boolean;
}

interface Workspace {
  id: string;
  name: string;
  path: string;
  lastAccessed: Date;
  settings: WorkspaceSettings;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  recentFiles: string[];
  
  // Actions
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  addRecentFile: (filePath: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      recentFiles: [],
      
      addWorkspace: (workspace) => 
        set(state => ({ 
          workspaces: [...state.workspaces, workspace] 
        })),
      
      removeWorkspace: (id) => 
        set(state => ({ 
          workspaces: state.workspaces.filter(w => w.id !== id),
          currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace
        })),
      
      setCurrentWorkspace: (workspace) => 
        set({ currentWorkspace: workspace }),
      
      updateWorkspace: (id, updates) => 
        set(state => ({
          workspaces: state.workspaces.map(w => 
            w.id === id ? { ...w, ...updates } : w
          )
        })),
      
      addRecentFile: (filePath) => 
        set(state => ({
          recentFiles: [filePath, ...state.recentFiles.filter(f => f !== filePath)].slice(0, 10)
        }))
    }),
    {
      name: 'workspace-storage'
    }
  )
)