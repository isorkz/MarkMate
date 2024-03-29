import { create } from "zustand";
import { TreeNode } from "../models/FileTree";

type EditingMode = 'rename' | 'newfile' | undefined

interface TreeStore {
  fileTree: TreeNode | undefined;
  setFileTree: (fileTree: TreeNode | undefined) => void;

  updateTreeNode: (updateNode: TreeNode) => void;

  pushTreeNode: (path: string, newNode: TreeNode) => void;

  reset: () => void;

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

    updateTreeNode: (updateNode: TreeNode) =>
      set((state) => {
        if (!state.fileTree) return state;

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
        if (!state.fileTree) return state;

        const dfs = (node: TreeNode) => {
          if (node.path === path) {
            if (node.children) {
              node.children.forEach(child => {
                if (child.name === newNode.name) {
                  throw new Error(`Name ${newNode.name} already exists in ${path}`)
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
        if (!state.fileTree) return state;

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