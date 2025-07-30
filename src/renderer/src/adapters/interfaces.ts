import { GitCommit, GitStatus, GitRemoteStatus } from '../../../shared/types/git'

export interface IFileAdapter {
  readFile(workspacePath: string, filePath: string): Promise<string>
  getLastModifiedTime(workspacePath: string, filePath: string): Promise<Date>
  writeFile(workspacePath: string, filePath: string, content: string): Promise<void>
  createFile(workspacePath: string, filePath: string, content?: string): Promise<void>
  deleteFile(workspacePath: string, filePath: string): Promise<void>
  renameFile(workspacePath: string, oldPath: string, newPath: string): Promise<void>
  createDirectory(workspacePath: string, dirPath: string): Promise<void>
  getImagePath(src: string, workspacePath: string, currentFilePath: string): Promise<string>
  saveImage(imageData: string, workspacePath: string, currentFilePath: string, extension?: string): Promise<string>
  getRelativePath(workspacePath: string, currentFilePath: string, targetFilePath: string): Promise<string>
  resolveRelativePath(workspacePath: string, currentFilePath: string, relativeFilePath: string): Promise<string>
}

export interface IGitAdapter {
  configGit(workspacePath: string, gitUsername: string, gitEmail: string, gitRemoteUrl: string): Promise<void>
  getFileHistory(workspacePath: string, filePath: string, limit?: number): Promise<GitCommit[]>
  getFileAtCommit(workspacePath: string, filePath: string, commitHash: string): Promise<string>
  getFileCommitsDiff(workspacePath: string, filePath: string, fromCommit: string, toCommit: string): Promise<string>
  getUncommittedDiff(workspacePath: string, filePath: string): Promise<string>
  restoreFile(workspacePath: string, filePath: string, commitHash: string): Promise<void>
  discardChanges(workspacePath: string, filePath: string): Promise<void>
  syncWorkspace(workspacePath: string, commitMessage: string, remote?: string, branch?: string): Promise<void>
  checkLocalStatus(workspacePath: string, filePath: string): Promise<GitStatus>
  checkRemoteStatus(workspacePath: string, remote?: string, branch?: string): Promise<GitRemoteStatus>
}

export interface IWorkspaceAdapter {
  openDialog(): Promise<any>
  getFileTree(workspacePath: string): Promise<any[]>
}