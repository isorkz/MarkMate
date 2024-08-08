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

const defaultSortTree = (node: TreeNode | undefined, index = 1) => {
  if (!node) {
    return
  }

  node.index = index

  if (node.children) {
    // folders first, then files, and then sort by name
    node.children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      } else {
        return a.type === 'folder' ? -1 : 1
      }
    })

    for (let i = 0; i < node.children.length; i++) {
      defaultSortTree(node.children[i], i + 1)
    }
  }
}

const openFileItemByDfs = (node: TreeNode | undefined, openedFile: string | undefined): boolean => {
  if (node && openedFile) {
    if (node.path === openedFile) {
      node.isOpened = true
      return true
    }

    if (node.children) {
      for (const child of node.children) {
        if (openFileItemByDfs(child, openedFile)) {
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

  pushTreeNode: (path: string, newNode: TreeNode) => void;
  removeTreeNode: (path: string) => void;

  openFileItem: (filePath: string) => void;

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

  dragSrc: TreeNode | undefined;
  setDragSrc: (dragSrc: TreeNode | undefined) => void;
  dragDes: { node: TreeNode; mode: 'top' | 'bottom' } | undefined;
  setDragDes: (dragDes: { node: TreeNode; mode: 'top' | 'bottom' } | undefined) => void;
  move: () => void;
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
        // Using default sort to sort the tree: folders first, then files, and then sort by name.
        defaultSortTree(treeData)
        openFileItemByDfs(treeData, activeFilePath)
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
              newNode.index = node.children[node.children.length - 1].index + 1
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

    removeTreeNode: (path: string) =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.fileTree) return {};

        const dfs = (node: TreeNode) => {
          if (node.children) {
            node.children = node.children.filter((n) => n.path !== path);
            node.children.forEach(dfs);
          }
        };

        dfs(state.fileTree);
        return { fileTree: { ...state.fileTree } };
      }),

    openFileItem: (openedFile: string) =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.fileTree) return {};

        openFileItemByDfs(state.fileTree, openedFile)
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

    dragSrc: undefined,
    setDragSrc: (dragSrc: TreeNode | undefined) => set({ dragSrc: dragSrc }),

    dragDes: undefined,
    setDragDes: (dragDes: { node: TreeNode; mode: 'top' | 'bottom' } | undefined) => set({ dragDes: dragDes }),

    move: () =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.fileTree) return {};

        const { dragSrc, dragDes } = state
        if (!dragSrc || !dragDes) return {};
        if (dragSrc.path === dragDes.node.path) return {}

        // for now, only support moving under the same parent
        const srcPath = dragSrc.path.slice(0, dragSrc.path.lastIndexOf('/'))
        const desPath = dragDes.node.path.slice(0, dragSrc.path.lastIndexOf('/'))
        if (srcPath !== desPath) return {}

        // switch the index of dragSrc and dragDes
        const dragSrcIndex = dragSrc.index
        dragSrc.index = dragDes.node.index
        dragDes.node.index = dragSrcIndex

        return { fileTree: { ...state.fileTree } };
      }),
  })
);

export default useTreeStore