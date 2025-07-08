import { create } from 'zustand'

interface FilePathEventStore {
  // Events - these don't store state, just trigger subscriptions
  notifyPathChange: (oldPath: string, newPath: string) => void
  notifyPathDelete: (path: string) => void
  
  // Internal state for triggering subscriptions
  lastPathChange: { oldPath: string; newPath: string; timestamp: number } | null
  lastPathDelete: { path: string; timestamp: number } | null
}

export const useFilePathEventStore = create<FilePathEventStore>((set) => ({
  lastPathChange: null,
  lastPathDelete: null,
  
  notifyPathChange: (oldPath: string, newPath: string) => {
    set({
      lastPathChange: { oldPath, newPath, timestamp: Date.now() }
    })
  },
  
  notifyPathDelete: (path: string) => {
    set({
      lastPathDelete: { path, timestamp: Date.now() }
    })
  }
}))