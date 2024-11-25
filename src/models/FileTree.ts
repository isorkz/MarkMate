import { nanoid } from 'nanoid'

export type FileTreeNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  isOpened?: boolean;
  index: number;
  favorite?: boolean;
  lastModifiedTime?: Date;  // undefined for folder
};

export const EmptyFileTreeNode = (): FileTreeNode => {
  return {
    id: nanoid(),
    name: '',
    path: '',
    type: 'file',
    children: undefined,
    isOpened: undefined,
    index: 1, // temporary index
    favorite: false,
    lastModifiedTime: new Date(),
  }
}