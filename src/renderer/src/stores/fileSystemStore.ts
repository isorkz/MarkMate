import { create } from 'zustand'
import { useFilePathEventStore } from './events/filePathEventStore'

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  // lastModified: Date;
}

interface FileSystemStore {
  fileTree: FileNode[];
  expandedFolders: Set<string>;
  
  // Actions
  setFileTree: (tree: FileNode[]) => void;
  toggleFolder: (path: string) => void;
  renameNodeRecursive: (oldPath: string, newName: string) => void;
}

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  fileTree: [],
  expandedFolders: new Set(),
  
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
  
  renameNodeRecursive: (oldPath, newName) => {
    const lastSlashIndex = oldPath.lastIndexOf('/')
    const parentPath = lastSlashIndex === -1 ? '' : oldPath.substring(0, lastSlashIndex)
    const newPath = parentPath ? `${parentPath}/${newName}` : newName

    const updateNodeAndChildren = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === oldPath) {
          // Update the main node
          return { 
            ...node, 
            path: newPath, 
            name: newName,
            children: node.children ? updateChildrenPaths(node.children, oldPath, newPath) : undefined
          };
        }
        if (node.children) {
          return { ...node, children: updateNodeAndChildren(node.children) };
        }
        return node;
      });
    };

    const updateChildrenPaths = (children: FileNode[], oldParentPath: string, newParentPath: string): FileNode[] => {
      return children.map(child => ({
        ...child,
        path: child.path.replace(oldParentPath, newParentPath),
        children: child.children ? updateChildrenPaths(child.children, oldParentPath, newParentPath) : undefined
      }));
    };
    
    set(state => ({ fileTree: updateNodeAndChildren(state.fileTree) }));
  }
}))

// Subscribe to file path events
useFilePathEventStore.subscribe((state) => {
  if (state.lastPathChange) {
    const { oldPath, newPath } = state.lastPathChange
    const { expandedFolders, renameNodeRecursive } = useFileSystemStore.getState()
    
    // Update the file node in the tree
    const newName = newPath.split('/').pop() || ''
    renameNodeRecursive(oldPath, newName)
    
    // Update expanded folders
    const newExpanded = new Set<string>()
    expandedFolders.forEach(path => {
      if (path === oldPath) {
        newExpanded.add(newPath)
      } else if (path.startsWith(oldPath + '/')) {
        newExpanded.add(path.replace(oldPath, newPath))
      } else {
        newExpanded.add(path)
      }
    })
    
    useFileSystemStore.setState({ expandedFolders: newExpanded })
  }
})

useFilePathEventStore.subscribe((state) => {
  if (state.lastPathDelete) {
    const { path } = state.lastPathDelete
    const { expandedFolders } = useFileSystemStore.getState()
    
    // Remove deleted paths from expanded folders
    const newExpanded = new Set<string>()
    expandedFolders.forEach(folderPath => {
      if (folderPath !== path && !folderPath.startsWith(path + '/')) {
        newExpanded.add(folderPath)
      }
    })
    
    useFileSystemStore.setState({ expandedFolders: newExpanded })
  }
})