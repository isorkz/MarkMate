import { GitCommit, GitStatus } from '../../../shared/types/git'
import { FileContentWithDate, FileNode } from '@shared/types/file'
import { AIConfig, AIModel, ChatMessage, AIOptions, ChatSession, ChatSessionInfo } from '../../../shared/types/ai'

export interface IFileAdapter {
  readFile(workspacePath: string, filePath: string): Promise<FileContentWithDate>
  writeFile(workspacePath: string, filePath: string, content: string): Promise<void>
  createFile(workspacePath: string, filePath: string, content?: string): Promise<void>
  deleteFile(workspacePath: string, filePath: string): Promise<void>
  renameFile(workspacePath: string, oldPath: string, newPath: string): Promise<void>
  createDirectory(workspacePath: string, dirPath: string): Promise<void>
  isFileExists(workspacePath: string, filePath: string): Promise<boolean>
  getImageUrl(src: string, workspacePath: string, currentFilePath: string): Promise<string>
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
  completeMerge(workspacePath: string, commitMessage: string): Promise<void>
  syncWorkspace(workspacePath: string, commitMessage: string, remote?: string, branch?: string): Promise<void>
  getFileSync(workspacePath: string, filePath: string, remote?: string, branch?: string): Promise<GitStatus>
}

export interface IWorkspaceAdapter {
  openDialog(): Promise<any>
  getFileTree(workspacePath: string): Promise<FileNode[]>
  getImages(workspacePath: string, imagesDir: string): Promise<FileNode[]>
}

export interface IAIAdapter {
  readConfig(workspacePath: string): Promise<AIConfig>
  writeConfig(workspacePath: string, config: AIConfig): Promise<void>
  setAIKey(apiKey: string): Promise<void>
  saveChatSession(workspacePath: string, session: ChatSession): Promise<void>
  loadChatSessions(workspacePath: string): Promise<ChatSessionInfo[]>
  loadChatSession(workspacePath: string, sessionId: string): Promise<ChatSession | null>
  deleteChatSession(workspacePath: string, sessionId: string): Promise<void>
  validateModel(model: AIModel): Promise<{ isValid: boolean; error?: string }>
  streamChat(model: AIModel, messages: ChatMessage[], options: AIOptions, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: string) => void): Promise<void>
}