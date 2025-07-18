import { ipcMain } from 'electron'

export function setupMenuHandlers() {
  // These handlers will be called from the renderer process
  // when menu events are triggered

  ipcMain.handle('menu:set-read-only-state', (_, isReadOnly: boolean) => {
    // Store the read-only state and notify renderer
    return isReadOnly
  })
}