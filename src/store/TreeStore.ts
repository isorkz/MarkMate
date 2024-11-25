import { create } from "zustand";
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware'
import { FileTreeNode } from "../models/FileTree";
import { Descendant } from "slate";
import { FileTreeUtils } from "../utils/FileTreeUtils";

type EditingMode = 'rename' | 'newfile' | 'newfolder' | undefined

type SyncStatus = 'up-to-date' | 'syncing' | 'out-of-date' | 'failed'

interface TreeStore {
  fileTree: FileTreeNode | undefined;

  // key: id, value: FileTreeNode
  // To speed up the search of a node by id
  treeNodeMap: Map<string, FileTreeNode>;

  favoriteNodes: FileTreeNode[];

  // Reload the file tree
  // 1. keep the current active file opened
  // 2. keep the index of each node for sorting
  // 3. keep the favorite status
  reloadTree: (rootDir: string | undefined, curActiveFilePath: string | undefined) => void;

  pushTreeNode: (parentId: string, newNode: FileTreeNode) => void;
  removeTreeNode: (id: string) => void;
  getTreeNodeById: (id: string) => FileTreeNode | undefined;
  openTreeNodeByDfs: (id: string) => void;
  updateTreeNode: (id: string, updatedFields: Partial<FileTreeNode>) => void;
  toggleFavorite: (id: string) => void;

  getFileNodeById: (id: string) => FileTreeNode | undefined;

  // Reset the intermediate states, such as editingNode, editingMode, etc.
  reset: () => void;

  // The current editing node, such as rename, delete, etc.
  editingNode: FileTreeNode | undefined;
  setEditingNode: (node: FileTreeNode | undefined) => void;
  editingMode: EditingMode
  setEditingMode: (mode: EditingMode) => void;

  dragSrc: FileTreeNode | undefined;
  setDragSrc: (dragSrc: FileTreeNode | undefined) => void;
  dragDes: { node: FileTreeNode; mode: 'top' | 'bottom' } | undefined;
  setDragDes: (dragDes: { node: FileTreeNode; mode: 'top' | 'bottom' } | undefined) => void;
  move: () => void;

  // TODO: move to another store
  syncStatus: SyncStatus;
  setSyncStatus: (syncStatus: SyncStatus) => void;

  // TODO: move to another store
  // Used in search.
  // key: file path, value: slate nodes
  slateNodesCache: Map<string, Descendant[]>;
}

const useTreeStore = create<TreeStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      fileTree: undefined,

      treeNodeMap: new Map<string, FileTreeNode>(),

      favoriteNodes: [],

      // TODO: move
      slateNodesCache: new Map(),

      // TODO: move
      syncStatus: 'out-of-date',
      setSyncStatus: (syncStatus: SyncStatus) => set({ syncStatus: syncStatus }),

      reloadTree: (rootDir: string | undefined, curActiveFilePath: string | undefined) => {
        if (!rootDir) return {};

        window.api.readDirTree(rootDir).then((treeData: any) => {
          const oldTree = get().fileTree;
          const newFileTree = FileTreeUtils.reloadAndMergeTree(treeData, oldTree)
          FileTreeUtils.openNodeByDfs(newFileTree, curActiveFilePath)
          set(state => {
            state.treeNodeMap.clear()
            FileTreeUtils.treeToMapById(newFileTree, state.treeNodeMap)
            const favoriteNodes: FileTreeNode[] = []
            FileTreeUtils.getFavoriteNodes(newFileTree, favoriteNodes)
            return { fileTree: newFileTree, favoriteNodes: favoriteNodes }
          });
        }).catch((err: any) => {
          throw new Error('Failed to read dir tree: ' + err);
        })
      },

      pushTreeNode: (parentId: string, newNode: FileTreeNode) =>
        set((state) => {
          // return {} means nothing needs to re-render
          if (!state.fileTree || !state.treeNodeMap) return {};

          const parentNode = state.treeNodeMap.get(parentId);
          if (!parentNode) throw new Error(`Failed to find parent node by id: ${parentId}`);
          if (!parentNode.children) parentNode.children = []

          parentNode.children.forEach(child => {
            if (child.name === newNode.name) {
              throw new Error(`Name \'${newNode.name}\' already exists in ${parentNode.path}`)
            }
          })

          newNode.index = parentNode.children.length > 0 ? parentNode.children[parentNode.children.length - 1].index + 1 : 1
          parentNode.children.push(newNode)
          state.treeNodeMap.set(newNode.id, newNode);

          // Return a new fileTree object to trigger re-render
          return { fileTree: { ...state.fileTree } };
        }),

      removeTreeNode: (id: string) =>
        set((state) => {
          if (!state.fileTree) return {};

          const dfs = (node: FileTreeNode) => {
            if (node.children) {
              node.children = node.children.filter((n) => n.id !== id);
              node.children.forEach(dfs);
            }
          };

          dfs(state.fileTree);
          state.treeNodeMap.delete(id);
          state.favoriteNodes = state.favoriteNodes.filter((n) => n.id !== id)
          return { fileTree: { ...state.fileTree }, favoriteNodes: state.favoriteNodes };
        }),

      getTreeNodeById: (id: string) => {
        // print the whole map
        console.log("getTreeNodeById: " + id)
        console.log(get().treeNodeMap)
        return get().treeNodeMap.get(id)
      },

      openTreeNodeByDfs: (id: string) =>
        set((state) => {
          if (!state.fileTree) return {};

          FileTreeUtils.openNodeByDfs(state.fileTree, id)
          return { fileTree: { ...state.fileTree } };
        }),

      toggleFavorite: (id: string) =>
        set((state) => {
          if (!state.fileTree) return {};

          let node = state.treeNodeMap.get(id)
          if (!node) throw new Error(`Failed to find tree node by id: ${id}`);

          node.favorite = !node.favorite
          let updatedFavoriteFiles = [...state.favoriteNodes];
          if (node.favorite) {
            updatedFavoriteFiles.push(node)
          } else {
            updatedFavoriteFiles = updatedFavoriteFiles.filter((n) => n.id !== id)
          }

          return { fileTree: { ...state.fileTree }, favoriteNodes: updatedFavoriteFiles };
        }),

      getFileNodeById: (id: string) => {
        return get().treeNodeMap.get(id)
      },

      updateTreeNode: (id: string, updatedFields: Partial<FileTreeNode>) =>
        set((state) => {
          if (!state.fileTree) return {};

          let node = state.treeNodeMap.get(id)
          if (!node) throw new Error(`Failed to find tree node by id: ${id}`);

          // Do not allow to update id, type, children
          const allowedUpdates = { ...updatedFields };
          delete allowedUpdates.id;
          delete allowedUpdates.type;
          delete allowedUpdates.children;

          // Update the node
          Object.assign(node, allowedUpdates);

          // Return a new fileTree object to trigger re-render
          return { fileTree: { ...state.fileTree } };
        }),

      reset: () =>
        set((state) => {
          if (!state.fileTree) return {};

          const dfs = (node: FileTreeNode) => {
            if (node.children) {
              node.children = node.children.filter((n) => n.name !== '');
              node.children.forEach(dfs);
            }
          };

          dfs(state.fileTree);
          return { fileTree: { ...state.fileTree }, editingMode: undefined, editingNode: undefined };
        }),

      editingNode: undefined,
      setEditingNode: (node: FileTreeNode | undefined) => set({ editingNode: node }),

      editingMode: undefined,
      setEditingMode: (mode: EditingMode) => set({ editingMode: mode }),

      dragSrc: undefined,
      setDragSrc: (dragSrc: FileTreeNode | undefined) => set({ dragSrc: dragSrc }),

      dragDes: undefined,
      setDragDes: (dragDes: { node: FileTreeNode; mode: 'top' | 'bottom' } | undefined) => set({ dragDes: dragDes }),

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
    })),
    {
      name: 'markmate-tree-store',          // unique name. For debugging, you can find it in Chrome DevTools 'Application' tab
      storage: createJSONStorage(() => localStorage),
      // partialize: enables you to pick some of the state's fields to be stored in the storage.
      partialize: (state) => ({ fileTree: state.fileTree, favoriteNodeIds: state.favoriteNodes }),
    }
  ));

export default useTreeStore
