export interface FileNode {
  id: string;
  name: string;   // Display name without file extension
  path: string;   // Includes file extension '.md' if it's a file
  type: 'file' | 'folder';
  children?: FileNode[];
  lastModified: Date; // Won't be updated for .md files, only used for image files now
}

export interface FileContentWithDate {
  content: string
  lastModified: Date
}