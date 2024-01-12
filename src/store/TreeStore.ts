import { create } from "zustand";
import { TreeNode } from "../models/FileTree";

interface TreeStore {
  fileTree: TreeNode | undefined;
  setFileTree: (fileTree: TreeNode | undefined) => void;

  updateTreeNode: (updateNode: TreeNode) => void;

  // The current editing node, such as rename, delete, etc.
  editingNode: TreeNode | undefined;
  setEditingNode: (node: TreeNode | undefined) => void;
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
            node.isRenaming = updateNode.isRenaming;
            return
          } else if (node.children) {
            node.children.forEach(dfs);
          }
        };

        dfs(state.fileTree);
        return { fileTree: { ...state.fileTree } };
      }),

    editingNode: undefined,
    setEditingNode: (node: TreeNode | undefined) => set({ editingNode: node }),
  })
);

export default useTreeStore