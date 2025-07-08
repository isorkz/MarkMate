import { create } from 'zustand'
import superjson from 'superjson'
import { persist, StorageValue } from 'zustand/middleware'
import { useFilePathEventStore } from './events/filePathEventStore'

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
  favorites: Set<string>;
  
  // Actions
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  addRecentFile: (filePath: string) => void;
  addFavorite: (filePath: string) => void;
  removeFavorite: (filePath: string) => void;
  toggleFavorite: (filePath: string) => void;
  isFavorite: (filePath: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      recentFiles: [],
      favorites: new Set<string>(),
      
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
        })),

      addFavorite: (filePath) =>
        set(state => ({
          favorites: new Set([...state.favorites, filePath])
        })),

      removeFavorite: (filePath) =>
        set(state => ({
          favorites: new Set([...state.favorites].filter(f => f !== filePath))
        })),

      toggleFavorite: (filePath) => {
        const { favorites } = get()
        if (favorites.has(filePath)) {
          get().removeFavorite(filePath)
        } else {
          get().addFavorite(filePath)
        }
      },

      isFavorite: (filePath) => get().favorites.has(filePath)
    }),
    {
      name: 'workspace-storage',
      // https://zustand.docs.pmnd.rs/integrations/persisting-store-data
      // To persist Map or Set type
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          return superjson.parse<StorageValue<WorkspaceStore>>(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, superjson.stringify(value))
        },
        removeItem: (name) => localStorage.removeItem(name),
      }
    }
  )
)

// Subscribe to file path events
useFilePathEventStore.subscribe((state) => {
  const pathChange = state.lastPathChange
  if (pathChange) {
    const { oldPath, newPath } = pathChange
    const { favorites, recentFiles } = useWorkspaceStore.getState()
    
    // Update favorites
    const newFavorites = new Set<string>()
    favorites.forEach(path => {
      if (path === oldPath) {
        newFavorites.add(newPath)
      } else if (path.startsWith(oldPath + '/')) {
        newFavorites.add(path.replace(oldPath, newPath))
      } else {
        newFavorites.add(path)
      }
    })
    
    // Update recent files
    const newRecentFiles = recentFiles.map(path => {
      if (path === oldPath) {
        return newPath
      } else if (path.startsWith(oldPath + '/')) {
        return path.replace(oldPath, newPath)
      }
      return path
    })
    
    useWorkspaceStore.setState({ 
      favorites: newFavorites,
      recentFiles: newRecentFiles
    })
  }
})

useFilePathEventStore.subscribe((state) => {
  const pathDelete = state.lastPathDelete
  if (pathDelete) {
    const { path } = pathDelete
    const { favorites, recentFiles } = useWorkspaceStore.getState()
    
    // Remove deleted paths from favorites
    const newFavorites = new Set<string>()
    favorites.forEach(favPath => {
      if (favPath !== path && !favPath.startsWith(path + '/')) {
        newFavorites.add(favPath)
      }
    })
    
    // Remove deleted paths from recent files
    const newRecentFiles = recentFiles.filter(filePath => 
      filePath !== path && !filePath.startsWith(path + '/')
    )
    
    useWorkspaceStore.setState({ 
      favorites: newFavorites,
      recentFiles: newRecentFiles
    })
  }
})