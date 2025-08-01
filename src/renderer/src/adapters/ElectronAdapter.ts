import { IFileAdapter, IGitAdapter, IWorkspaceAdapter } from './interfaces'
import { GitCommit, GitStatus, GitRemoteStatus } from '../../../shared/types/git'

export class ElectronFileAdapter implements IFileAdapter {
  async readFile(workspacePath: string, filePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('file:read', workspacePath, filePath)
  }

  async getLastModifiedTime(workspacePath: string, filePath: string): Promise<Date> {
    const result = await window.electron.ipcRenderer.invoke('file:get-last-modified-time', workspacePath, filePath)
    return new Date(result)
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

  async getImagePath(src: string, workspacePath: string, currentFilePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('file:get-image-path', src, workspacePath, currentFilePath)
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

  async syncWorkspace(workspacePath: string, commitMessage: string, remote = 'origin', branch = 'main'): Promise<void> {
    await window.electron.ipcRenderer.invoke('git:sync', workspacePath, commitMessage, remote, branch)
  }

  async checkLocalStatus(workspacePath: string, filePath: string): Promise<GitStatus> {
    return window.electron.ipcRenderer.invoke('git:check-local-status', workspacePath, filePath)
  }

  async checkRemoteStatus(workspacePath: string, remote = 'origin', branch = 'main'): Promise<GitRemoteStatus> {
    return window.electron.ipcRenderer.invoke('git:check-remote-status', workspacePath, remote, branch)
  }
}

export class ElectronWorkspaceAdapter implements IWorkspaceAdapter {
  async openDialog(): Promise<any> {
    return window.electron.ipcRenderer.invoke('workspace:open-dialog')
  }

  async getFileTree(workspacePath: string): Promise<any[]> {
    return window.electron.ipcRenderer.invoke('workspace:get-file-tree', workspacePath)
  }
}