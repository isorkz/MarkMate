import { IFileAdapter, IGitAdapter, IWorkspaceAdapter, IAIAdapter } from './interfaces'
import { GitCommit, GitStatus } from '../../../shared/types/git'
import { FileContentWithDate, FileNode } from '@shared/types/file'
import { AIConfig, ChatSession, ChatSessionInfo } from '../../../shared/types/ai'

export class ElectronFileAdapter implements IFileAdapter {
  async readFile(workspacePath: string, filePath: string): Promise<FileContentWithDate> {
    return window.electron.ipcRenderer.invoke('file:read', workspacePath, filePath)
  }

  async writeFile(workspacePath: string, filePath: string, content: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('file:write', workspacePath, filePath, content)
  }

  async createFile(workspacePath: string, filePath: string, content = ''): Promise<void> {
    await window.electron.ipcRenderer.invoke('file:create', workspacePath, filePath, content)
  }

  async deleteFile(workspacePath: string, filePath: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('file:delete', workspacePath, filePath)
  }

  async renameFile(workspacePath: string, oldPath: string, newPath: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('file:rename', workspacePath, oldPath, newPath)
  }

  async createDirectory(workspacePath: string, dirPath: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('file:create-directory', workspacePath, dirPath)
  }

  async isFileExists(workspacePath: string, filePath: string): Promise<boolean> {
    return window.electron.ipcRenderer.invoke('file:exists', workspacePath, filePath)
  }

  async getImageUrl(imagePath: string, workspacePath: string, currentFilePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('file:get-image-url', imagePath, workspacePath, currentFilePath)
  }

  async saveImage(imageData: string, workspacePath: string, currentFilePath: string, extension = 'png'): Promise<string> {
    return window.electron.ipcRenderer.invoke('file:save-image', imageData, workspacePath, currentFilePath, extension)
  }

  async getRelativePath(workspacePath: string, currentFilePath: string, targetFilePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('file:get-relative-path', workspacePath, currentFilePath, targetFilePath)
  }

  async resolveRelativePath(workspacePath: string, currentFilePath: string, relativeFilePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('file:resolve-relative-path', workspacePath, currentFilePath, relativeFilePath)
  }
}

export class ElectronGitAdapter implements IGitAdapter {
  async configGit(workspacePath: string, gitUsername: string, gitEmail: string, gitRemoteUrl: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('git:config', workspacePath, gitUsername, gitEmail, gitRemoteUrl)
  }

  async getFileHistory(workspacePath: string, filePath: string, limit = 20): Promise<GitCommit[]> {
    return window.electron.ipcRenderer.invoke('git:history', workspacePath, filePath, limit)
  }

  async getFileAtCommit(workspacePath: string, filePath: string, commitHash: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('git:get-file-commit', workspacePath, filePath, commitHash)
  }

  async getFileCommitsDiff(workspacePath: string, filePath: string, fromCommit: string, toCommit: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('git:get-file-commits-diff', workspacePath, filePath, fromCommit, toCommit)
  }

  async getUncommittedDiff(workspacePath: string, filePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('git:get-uncommitted-diff', workspacePath, filePath)
  }

  async restoreFile(workspacePath: string, filePath: string, commitHash: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('git:restore', workspacePath, filePath, commitHash)
  }

  async discardChanges(workspacePath: string, filePath: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('git:discard-changes', workspacePath, filePath)
  }

  async completeMerge(workspacePath: string, commitMessage: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('git:complete-merge', workspacePath, commitMessage)
  }

  async syncWorkspace(workspacePath: string, commitMessage: string, remote = 'origin', branch = 'main'): Promise<void> {
    await window.electron.ipcRenderer.invoke('git:sync', workspacePath, commitMessage, remote, branch)
  }

  async getFileSync(workspacePath: string, filePath: string, remote = 'origin', branch = 'main'): Promise<GitStatus> {
    return window.electron.ipcRenderer.invoke('git:get-file-sync', workspacePath, filePath, remote, branch)
  }
}

export class ElectronWorkspaceAdapter implements IWorkspaceAdapter {
  async openDialog(): Promise<any> {
    return window.electron.ipcRenderer.invoke('workspace:open-dialog')
  }

  async getFileTree(workspacePath: string): Promise<FileNode[]> {
    return window.electron.ipcRenderer.invoke('workspace:get-file-tree', workspacePath)
  }

  async getImages(workspacePath: string, imagesDir: string): Promise<FileNode[]> {
    return window.electron.ipcRenderer.invoke('workspace:get-images', workspacePath, imagesDir)
  }
}

export class ElectronAIAdapter implements IAIAdapter {
  async readConfig(workspacePath: string): Promise<AIConfig> {
    return window.electron.ipcRenderer.invoke('ai-config:read', workspacePath)
  }

  async writeConfig(workspacePath: string, config: AIConfig): Promise<void> {
    await window.electron.ipcRenderer.invoke('ai-config:write', workspacePath, config)
  }

  async setAIKey(apiKey: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('ai-config:set-ai-key', apiKey)
  }

  async saveChatSession(workspacePath: string, session: ChatSession): Promise<void> {
    await window.electron.ipcRenderer.invoke('ai-session:save', workspacePath, session)
  }

  async loadChatSessions(workspacePath: string): Promise<ChatSessionInfo[]> {
    return window.electron.ipcRenderer.invoke('ai-session:load-list', workspacePath)
  }

  async loadChatSession(workspacePath: string, sessionId: string): Promise<ChatSession | null> {
    return window.electron.ipcRenderer.invoke('ai-session:load', workspacePath, sessionId)
  }

  async deleteChatSession(workspacePath: string, sessionId: string): Promise<void> {
    await window.electron.ipcRenderer.invoke('ai-session:delete', workspacePath, sessionId)
  }
}