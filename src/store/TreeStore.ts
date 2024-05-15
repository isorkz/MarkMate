import { create } from "zustand";
import { TreeNode } from "../models/FileTree";
import { Descendant } from "slate";

type EditingMode = 'rename' | 'newfile' | undefined

type SyncStatus = 'up-to-date' | 'syncing' | 'out-of-date' | 'failed'

const initTreeType = (node: TreeNode | undefined) => {
  if (!node) {
    return
  }

  if (node.children) {
    node.type = 'folder'
    for (const child of node.children) {
      initTreeType(child)
    }
  } else {
    node.type = 'file'
  }
}

const initTreeIsOpened = (node: TreeNode | undefined, openedFile: string | undefined): boolean => {
  if (node && openedFile) {
    if (node.path === openedFile) {
      node.isOpened = true
      return true
    }

    if (node.children) {
      for (const child of node.children) {
        if (initTreeIsOpened(child, openedFile)) {
          node.isOpened = true;
          return true;
        }
      }
    }
  }
  return false
}

interface TreeStore {
  fileTree: TreeNode | undefined;
  setFileTree: (fileTree: TreeNode | undefined) => void;

  initTree: (rootDir: string | undefined, activeFilePath: string | undefined) => void;

  updateTreeNode: (updateNode: TreeNode) => void;

  pushTreeNode: (path: string, newNode: TreeNode) => void;

  reset: () => void;

  // key: file path, value: slate nodes
  slateNodesCache: Map<string, Descendant[]>;

  syncStatus: SyncStatus;
  setSyncStatus: (syncStatus: SyncStatus) => void;

  // The current editing node, such as rename, delete, etc.
  editingNode: TreeNode | undefined;
  setEditingNode: (node: TreeNode | undefined) => void;
  editingMode: EditingMode
  setEditingMode: (mode: EditingMode) => void;
}

// stored in memory
const useTreeStore = create<TreeStore>()(
  (set) => ({
    fileTree: undefined,
    setFileTree: (fileTree: TreeNode | undefined) => set({ fileTree: fileTree }),

    initTree: (rootDir: string | undefined, activeFilePath: string | undefined) => {
      if (!rootDir) return;

      window.api.readDirTree(rootDir).then((treeData: any) => {
        initTreeType(treeData)
        initTreeIsOpened(treeData, activeFilePath)
        set(state => {
          state.slateNodesCache.clear()
          return { fileTree: treeData }
        });
      }).catch((err: any) => {
        throw new Error('Failed to read dir tree: ' + err);
      })
    },

    slateNodesCache: new Map(),

    syncStatus: 'out-of-date',
    setSyncStatus: (syncStatus: SyncStatus) => set({ syncStatus: syncStatus }),

    updateTreeNode: (updateNode: TreeNode) =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.fileTree) return {};

        const dfs = (node: TreeNode) => {
          if (node.path === updateNode.path) {
            node.name = updateNode.name;
            return
          } else if (node.children) {
            node.children.forEach(dfs);
          }
        };

        dfs(state.fileTree);
        return { fileTree: { ...state.fileTree } };
      }),

    pushTreeNode: (path: string, newNode: TreeNode) =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.fileTree) return {};

        const dfs = (node: TreeNode) => {
          if (node.path === path) {
            if (node.children) {
              node.children.forEach(child => {
                if (child.name === newNode.name) {
                  throw new Error(`Name \'${newNode.name}\' already exists in ${path}`)
                }
              })
              node.children.push(newNode)
              return
            }
          } else if (node.children) {
            node.children.forEach(dfs);
          }
        };

        dfs(state.fileTree);
        return { fileTree: { ...state.fileTree } };
      }),

    reset: () =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.fileTree) return {};

        const dfs = (node: TreeNode) => {
          if (node.children) {
            node.children = node.children.filter((n) => n.name !== '');
            node.children.forEach(dfs);
          }
        };

        dfs(state.fileTree);
        return { fileTree: { ...state.fileTree }, editingMode: undefined, editingNode: undefined };
      }),

    editingNode: undefined,
    setEditingNode: (node: TreeNode | undefined) => set({ editingNode: node }),

    editingMode: undefined,
    setEditingMode: (mode: EditingMode) => set({ editingMode: mode }),
  })
);

export default useTreeStore