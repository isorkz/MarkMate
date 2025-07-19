import { ipcMain, BrowserWindow } from 'electron'
import { createAppMenu } from '../menu'

export function setupMenuHandlers() {
  // These handlers will be called from the renderer process
  // when menu events are triggered

  ipcMain.handle('menu:set-read-only-state', (_, isReadOnly: boolean) => {
    // Store the read-only state and notify renderer
    return isReadOnly
  })

  ipcMain.handle('menu:update-recent-files', (_, recentFiles: string[]) => {
    // Update the application menu with new recent files
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      createAppMenu(mainWindow, recentFiles)
    }
    return true
  })
}