import { setupWorkspaceHandlers } from './workspaceHandler'
import { setupFileHandlers } from './fileHandler'
import { setupGitHandlers } from './gitHandler'
import { setupMenuHandlers } from './menuHandler'
import { setupAIHandlers } from './aiHandler'

export function setupIpcHandlers() {
  setupWorkspaceHandlers()
  setupFileHandlers()
  setupGitHandlers()
  setupMenuHandlers()
  setupAIHandlers()
}