export interface GitCommit {
  hash: string
  message: string
  date: string
  author: string
  filePath: string
}

export interface GitStatus {
  hasLocalChanges: boolean   // Whether file has local changes (working dir + staging)
  hasRemoteUpdates: boolean  // Whether remote has updates to pull
  isConflicted: boolean      // Whether file is in conflict state
}

export type SyncStatus = 'synced' | 'out-of-date' | 'conflict' | 'syncing' | 'error'