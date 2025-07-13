import { setupWorkspaceHandlers } from './workspaceHandler'
import { setupFileHandlers } from './fileHandler'
import { setupGitHandlers } from './gitHandler'

export function setupIpcHandlers() {
  setupWorkspaceHandlers()
  setupFileHandlers()
  setupGitHandlers()
}