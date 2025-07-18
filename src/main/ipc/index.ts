import { setupWorkspaceHandlers } from './workspaceHandler'
import { setupFileHandlers } from './fileHandler'
import { setupGitHandlers } from './gitHandler'
import { setupMenuHandlers } from './menuHandler'

export function setupIpcHandlers() {
  setupWorkspaceHandlers()
  setupFileHandlers()
  setupGitHandlers()
  setupMenuHandlers()
}