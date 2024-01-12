export type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
  isOpened?: boolean;
  isRenaming?: boolean;
};