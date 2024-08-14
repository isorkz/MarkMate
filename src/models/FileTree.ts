export type TreeNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  isOpened?: boolean;
  index: number;
  favorite?: boolean;
};