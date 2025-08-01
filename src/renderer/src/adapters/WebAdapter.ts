import { IFileAdapter, IGitAdapter, IWorkspaceAdapter } from './interfaces'
import { GitCommit, GitStatus, GitRemoteStatus } from '../../../shared/types/git'

const API_BASE_URL = '/api'

class ApiClient {
  static async post(endpoint: string, data: any = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  static async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }
}

export class WebFileAdapter implements IFileAdapter {
  async readFile(_workspacePath: string, filePath: string): Promise<string> {
    const result = await ApiClient.post('/file/read', { filePath })
    return result.content
  }

  async getLastModifiedTime(_workspacePath: string, filePath: string): Promise<Date> {
    const result = await ApiClient.post('/file/get-last-modified-time', { filePath })
    return new Date(result.lastModified)
  }

  async writeFile(_workspacePath: string, filePath: string, content: string): Promise<void> {
    await ApiClient.post('/file/write', { filePath, content })
  }

  async createFile(_workspacePath: string, filePath: string, content = ''): Promise<void> {
    await ApiClient.post('/file/create', { filePath, content })
  }

  async deleteFile(_workspacePath: string, filePath: string): Promise<void> {
    await ApiClient.post('/file/delete', { filePath })
  }

  async renameFile(_workspacePath: string, oldPath: string, newPath: string): Promise<void> {
    await ApiClient.post('/file/rename', { oldPath, newPath })
  }

  async createDirectory(_workspacePath: string, dirPath: string): Promise<void> {
    await ApiClient.post('/file/create-directory', { dirPath })
  }

  async getImagePath(src: string, _workspacePath: string, currentFilePath: string): Promise<string> {
    const result = await ApiClient.post('/file/get-image-path', { src, currentFilePath })
    return result.imagePath
  }

  async saveImage(imageData: string, _workspacePath: string, currentFilePath: string, extension = 'png'): Promise<string> {
    const result = await ApiClient.post('/file/save-image', { imageData, currentFilePath, extension })
    return result.relativePath
  }

  async getRelativePath(_workspacePath: string, currentFilePath: string, targetFilePath: string): Promise<string> {
    const result = await ApiClient.post('/file/get-relative-path', { currentFilePath, targetFilePath })
    return result.relativePath
  }

  async resolveRelativePath(_workspacePath: string, currentFilePath: string, relativeFilePath: string): Promise<string> {
    const result = await ApiClient.post('/file/resolve-relative-path', { currentFilePath, relativeFilePath })
    return result.resolvedPath
  }
}

export class WebGitAdapter implements IGitAdapter {
  async configGit(_workspacePath: string, gitUsername: string, gitEmail: string, gitRemoteUrl: string): Promise<void> {
    await ApiClient.post('/git/config', { gitUsername, gitEmail, gitRemoteUrl })
  }

  async getFileHistory(_workspacePath: string, filePath: string, limit = 20): Promise<GitCommit[]> {
    return ApiClient.post('/git/history', { filePath, limit })
  }

  async getFileAtCommit(_workspacePath: string, filePath: string, commitHash: string): Promise<string> {
    const result = await ApiClient.post('/git/get-file-commit', { filePath, commitHash })
    return result.content
  }

  async getFileCommitsDiff(_workspacePath: string, filePath: string, fromCommit: string, toCommit: string): Promise<string> {
    const result = await ApiClient.post('/git/get-file-commits-diff', { filePath, fromCommit, toCommit })
    return result.diff
  }

  async getUncommittedDiff(_workspacePath: string, filePath: string): Promise<string> {
    const result = await ApiClient.post('/git/get-uncommitted-diff', { filePath })
    return result.diff
  }

  async restoreFile(_workspacePath: string, filePath: string, commitHash: string): Promise<void> {
    await ApiClient.post('/git/restore', { filePath, commitHash })
  }

  async discardChanges(_workspacePath: string, filePath: string): Promise<void> {
    await ApiClient.post('/git/discard-changes', { filePath })
  }

  async syncWorkspace(_workspacePath: string, commitMessage: string, remote = 'origin', branch = 'main'): Promise<void> {
    await ApiClient.post('/git/sync', { commitMessage, remote, branch })
  }

  async checkLocalStatus(_workspacePath: string, filePath: string): Promise<GitStatus> {
    return ApiClient.post('/git/check-local-status', { filePath })
  }

  async checkRemoteStatus(_workspacePath: string, remote = 'origin', branch = 'main'): Promise<GitRemoteStatus> {
    return ApiClient.post('/git/check-remote-status', { remote, branch })
  }
}

export class WebWorkspaceAdapter implements IWorkspaceAdapter {
  async openDialog(): Promise<any> {
    // For web version, workspace is predefined in environment variable
    // Return the workspace info from server
    return ApiClient.get('/workspace/info')
  }

  async getFileTree(_workspacePath: string): Promise<any[]> {
    return ApiClient.get('/workspace/file-tree')
  }
}