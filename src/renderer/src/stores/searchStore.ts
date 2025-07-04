import { create } from 'zustand'

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isExpanded?: boolean;
  lastModified: Date;
  size?: number;
}

interface SearchStore {
  searchQuery: string;
  searchResults: FileNode[];
  isSearching: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: FileNode[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setIsSearching: (isSearching) => set({ isSearching }),
  
  clearSearch: () => set({ 
    searchQuery: '', 
    searchResults: [], 
    isSearching: false 
  })
}))