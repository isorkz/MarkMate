export interface GitCommit {
  hash: string
  message: string
  date: string
  author: string
  filePath: string
}

export interface GitStatus {
  hasChanges: boolean
}

export interface GitRemoteStatus {
  hasUnpushedCommits: boolean
}

export type SyncStatus = 'out-of-date' | 'syncing' | 'synced' | 'error'