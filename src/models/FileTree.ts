export type FileTreeNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  isOpened?: boolean;
  index: number;
  favorite?: boolean;
  lastModifiedTime?: Date;
};