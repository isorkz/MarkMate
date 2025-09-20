import { IFileAdapter, IGitAdapter, IWorkspaceAdapter, IAIAdapter } from './interfaces'
import { GitCommit, GitStatus } from '../../../shared/types/git'
import { FileContentWithDate, FileNode } from '@shared/types/file'
import { AIConfig, ChatSession, ChatSessionInfo } from '../../../shared/types/ai'

const API_BASE_URL = '/api'

// Function to get access key from settings
const getAccessKey = (): string => {
  try {
    const settings = JSON.parse(localStorage.getItem('settings-storage') || '{}')
    return settings?.state?.webSettings?.accessKey || ''
  } catch {
    console.error('Failed to parse web access key from localStorage')
    return ''
  }
}

class ApiClient {
  static async post(endpoint: string, data: any = {}) {
    const token = getAccessKey()
    const headers: any = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  static async get(endpoint: string) {
    const token = getAccessKey()
    const headers: any = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }
}

export class WebFileAdapter implements IFileAdapter {
  async readFile(_workspacePath: string, filePath: string): Promise<FileContentWithDate> {
    const result = await ApiClient.post('/file/read', { filePath })
    return {
      content: result.content,
      lastModified: new Date(result.lastModified)
    }
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

  async isFileExists(_workspacePath: string, filePath: string): Promise<boolean> {
    const result = await ApiClient.post('/file/exists', { filePath })
    return result.exists
  }

  async getImageUrl(imagePath: string, workspacePath: string, currentFilePath: string): Promise<string> {
    const result = await ApiClient.post('/file/get-image-url', { imagePath, workspacePath, currentFilePath })
    return result.imageUrl
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

  async completeMerge(_workspacePath: string, commitMessage: string): Promise<void> {
    await ApiClient.post('/git/complete-merge', { commitMessage })
  }

  async syncWorkspace(_workspacePath: string, commitMessage: string, remote = 'origin', branch = 'main'): Promise<void> {
    await ApiClient.post('/git/sync', { commitMessage, remote, branch })
  }

  async getFileSync(_workspacePath: string, filePath: string, remote = 'origin', branch = 'main'): Promise<GitStatus> {
    return ApiClient.post('/git/get-file-sync', { filePath, remote, branch })
  }

  async gitStatus(_workspacePath: string): Promise<{simpleGitStatus: any, gitStatus: string}> {
    return ApiClient.post('/git/status')
  }
}

export class WebWorkspaceAdapter implements IWorkspaceAdapter {
  async openDialog(): Promise<any> {
    // For web version, workspace is predefined in environment variable
    // Return the workspace info from server
    return ApiClient.get('/workspace/info')
  }

  async getFileTree(_workspacePath: string): Promise<FileNode[]> {
    return ApiClient.get('/workspace/file-tree')
  }

  async getImages(_workspacePath: string, imagesDir: string): Promise<FileNode[]> {
    return ApiClient.post('/workspace/get-images', { imagesDir })
  }
}

export class WebAIAdapter implements IAIAdapter {
  async readConfig(_workspacePath: string): Promise<AIConfig> {
    return ApiClient.post('/ai/read-config')
  }

  async writeConfig(_workspacePath: string, config: AIConfig): Promise<void> {
    await ApiClient.post('/ai/write-config', { config })
  }

  async setAIKey(apiKey: string): Promise<void> {
    await ApiClient.post('/ai/set-ai-key', { apiKey })
  }

  async saveChatSession(_workspacePath: string, session: ChatSession): Promise<void> {
    await ApiClient.post('/ai/save-session', { session })
  }

  async loadChatSessions(_workspacePath: string): Promise<ChatSessionInfo[]> {
    return ApiClient.get('/ai/load-sessions')
  }

  async loadChatSession(_workspacePath: string, sessionId: string): Promise<ChatSession | null> {
    return ApiClient.post('/ai/load-session', { sessionId })
  }

  async deleteChatSession(_workspacePath: string, sessionId: string): Promise<void> {
    await ApiClient.post('/ai/delete-session', { sessionId })
  }
}