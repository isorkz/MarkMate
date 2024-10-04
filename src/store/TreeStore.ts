import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import { TreeNode } from "../models/FileTree";
import { Descendant } from "slate";
import { nanoid } from 'nanoid'

type EditingMode = 'rename' | 'newfile' | undefined

type SyncStatus = 'up-to-date' | 'syncing' | 'out-of-date' | 'failed'

// The result of readDirTree() looks like:
// {
//   "path": "/Users/xxx/md",
//   "name": "md",
//   "children": [
//     {
//       "path": "/Users/xxx/md/my-folder",
//       "name": "my-folder",
//       "children": [
//         {
//           "path": "/Users/xxx/md/my-folder/test.md",
//           "name": "test.md",
//         }
//       ]
//     },
//   ]
// }
const updateTreeIndex = (children: TreeNode[], oldTreeMap: Map<string, TreeNode>) => {
  // If the old node has index, then use it, otherwise, set it to -1
  for (const child of children) {
    const oldChildNode = oldTreeMap.get(child.path.toLowerCase())
    child.index = oldChildNode ? oldChildNode.index : -1
  }

  // sort the children by index, if index is -1, then put it at the end
  children.sort((a, b) => {
    if (a.index === -1) {
      return 1
    } else if (b.index === -1) {
      return -1
    } else {
      return a.index - b.index
    }
  })

  // update the index
  for (let i = 0; i < children.length; i++) {
    children[i].index = i + 1
  }
}

const updateTree = (node: TreeNode, oldTreeMap: Map<string, TreeNode>) => {
  if (!node) {
    return
  }

  const oldNode = oldTreeMap.get(node.path.toLowerCase())
  node.id = oldNode && oldNode.id ? oldNode.id : nanoid()
  node.favorite = oldNode?.favorite

  if (node.children) {
    node.type = 'folder'

    updateTreeIndex(node.children, oldTreeMap)

    for (const child of node.children) {
      updateTree(child, oldTreeMap)
    }
  } else {
    node.type = 'file'
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

const treeToMapByPath = (node: TreeNode | undefined, treeMap: Map<string, TreeNode>) => {
  if (!node) {
    return
  }

  treeMap.set(node.path.toLowerCase(), node)

  if (node.children) {
    for (const child of node.children) {
      treeToMapByPath(child, treeMap)
    }
  }
}

const treeToMapById = (node: TreeNode | undefined, treeMap: Map<string, TreeNode>) => {
  if (!node) {
    return
  }

  treeMap.set(node.id, node)

  if (node.children) {
    for (const child of node.children) {
      treeToMapById(child, treeMap)
    }
  }
}

const loadFileTree = (treeData: any, oldTree: TreeNode | undefined): TreeNode => {
  const newTree = JSON.parse(JSON.stringify(treeData))

  // key: file path, value: TreeNode
  let oldTreeMap = new Map<string, TreeNode>()
  treeToMapByPath(oldTree, oldTreeMap)

  updateTree(newTree, oldTreeMap)
  return newTree
}

const getFavoriteFiles = (node: TreeNode, favoriteFiles: TreeNode[]) => {
  if (node.children) {
    for (const child of node.children) {
      getFavoriteFiles(child, favoriteFiles)
    }
  } else {
    if (node.favorite) {
      favoriteFiles.push(node)
    }
  }
}

interface TreeStore {
  fileTree: TreeNode | undefined;
  setFileTree: (fileTree: TreeNode | undefined) => void;

  // key: id, value: TreeNode
  treeNodeMap: Map<string, TreeNode>;

  favoriteFiles: TreeNode[];

  loadTree: (rootDir: string | undefined, activeFilePath: string | undefined) => void;

  pushTreeNode: (path: string, newNode: TreeNode) => void;
  removeTreeNode: (id: string) => void;
  toggleFavoriteTreeNode: (id: string) => void;

  openFileItem: (filePath: string) => void;

  reset: () => void;

  // Used in search.
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
  persist(
    (set, get) => ({
      fileTree: undefined,
      setFileTree: (fileTree: TreeNode | undefined) => set({ fileTree: fileTree }),

      treeNodeMap: new Map<string, TreeNode>(),

      favoriteFiles: [],

      loadTree: (rootDir: string | undefined, activeFilePath: string | undefined) => {
        if (!rootDir) return;

        window.api.readDirTree(rootDir).then((treeData: any) => {
          const newFileTree = loadFileTree(treeData, get().fileTree)
          openFileItemByDfs(newFileTree, activeFilePath)
          set(state => {
            state.slateNodesCache.clear()
            state.treeNodeMap.clear()
            treeToMapById(newFileTree, state.treeNodeMap)
            const favoriteFiles: TreeNode[] = []
            getFavoriteFiles(newFileTree, favoriteFiles)
            return { fileTree: newFileTree, favoriteFiles: favoriteFiles }
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
              if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                  if (child.name === newNode.name) {
                    throw new Error(`Name \'${newNode.name}\' already exists in ${path}`)
                  }
                })
                newNode.index = node.children[node.children.length - 1].index + 1
                node.children.push(newNode)
                return
              } else {
                node.children = [newNode]
                return
              }
            } else if (node.children) {
              node.children.forEach(dfs);
            }
          };

          dfs(state.fileTree);
          state.treeNodeMap.set(newNode.id, newNode);
          return { fileTree: { ...state.fileTree } };
        }),

      removeTreeNode: (id: string) =>
        set((state) => {
          // return {} means nothing needs to re-render
          if (!state.fileTree) return {};

          const dfs = (node: TreeNode) => {
            if (node.children) {
              node.children = node.children.filter((n) => n.id !== id);
              node.children.forEach(dfs);
            }
          };

          dfs(state.fileTree);
          state.treeNodeMap.delete(id);
          state.favoriteFiles = state.favoriteFiles.filter((n) => n.id !== id)
          return { fileTree: { ...state.fileTree }, favoriteFiles: state.favoriteFiles };
        }),

      toggleFavoriteTreeNode: (id: string) =>
        set((state) => {
          // return {} means nothing needs to re-render
          if (!state.fileTree) return {};

          let node = state.treeNodeMap.get(id)
          if (!node) return {}

          node.favorite = !node.favorite
          let updatedFavoriteFiles = [...state.favoriteFiles];
          if (node.favorite) {
            updatedFavoriteFiles.push(node)
          } else {
            updatedFavoriteFiles = updatedFavoriteFiles.filter((n) => n.id !== id)
          }

          return { fileTree: { ...state.fileTree }, favoriteFiles: updatedFavoriteFiles };
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
    }),
    {
      name: 'markmate-store-tree',          // unique name. For debugging, you can find it in Chrome DevTools 'Application' tab
      storage: createJSONStorage(() => localStorage),
      // partialize: enables you to pick some of the state's fields to be stored in the storage.
      partialize: (state) => ({ fileTree: state.fileTree }),
    }
  ));

export default useTreeStore