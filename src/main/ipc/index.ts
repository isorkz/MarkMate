import { setupWorkspaceHandlers } from './workspaceHandler'
import { setupFileHandlers } from './fileHandler'

export function setupIpcHandlers() {
  setupWorkspaceHandlers()
  setupFileHandlers()
}