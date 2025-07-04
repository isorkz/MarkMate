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

interface FileSystemStore {
  fileTree: FileNode[];
  expandedFolders: Set<string>;
  focusedFile: string | null; // Currently focused/highlighted file in tree
  
  // Actions
  setFileTree: (tree: FileNode[]) => void;
  toggleFolder: (path: string) => void;
  setFocusedFile: (path: string | null) => void;
  updateFileNode: (path: string, updates: Partial<FileNode>) => void;
}

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  fileTree: [],
  expandedFolders: new Set(),
  focusedFile: null,
  
  setFileTree: (tree) => set({ fileTree: tree }),
  
  toggleFolder: (path) => 
    set(state => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    }),
  
  setFocusedFile: (path) => set({ focusedFile: path }),
  
  updateFileNode: (path, updates) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          return { ...node, ...updates };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    
    set(state => ({ fileTree: updateNode(state.fileTree) }));
  }
}))