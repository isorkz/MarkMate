export interface FileNode {
  id: string;
  name: string;   // Display name without file extension
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  // lastModified: Date;
}