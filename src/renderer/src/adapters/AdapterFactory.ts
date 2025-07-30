import { IFileAdapter, IGitAdapter, IWorkspaceAdapter } from './interfaces'
import { ElectronFileAdapter, ElectronGitAdapter, ElectronWorkspaceAdapter } from './ElectronAdapter'
import { WebFileAdapter, WebGitAdapter, WebWorkspaceAdapter } from './WebAdapter'

// Check if running in Electron environment
const isElectron = typeof window !== 'undefined' && window.electron

export function createFileAdapter(): IFileAdapter {
  return isElectron ? new ElectronFileAdapter() : new WebFileAdapter()
}

export function createGitAdapter(): IGitAdapter {
  return isElectron ? new ElectronGitAdapter() : new WebGitAdapter()
}

export function createWorkspaceAdapter(): IWorkspaceAdapter {
  return isElectron ? new ElectronWorkspaceAdapter() : new WebWorkspaceAdapter()
}

export function createAdapters() {
  return {
    fileAdapter: createFileAdapter(),
    gitAdapter: createGitAdapter(),
    workspaceAdapter: createWorkspaceAdapter()
  }
}