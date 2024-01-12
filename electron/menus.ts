import { ipcMain, BrowserWindow, Menu } from 'electron';

export const registerMenus = (): void => {
  ipcMain.on('show-file-tree-menu', (e, params: {
    filePath: string,
  }) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Rename',
        click: () => {
          e.sender.send('tree-command-rename', { filePath: params.filePath })
        }
      },
      {
        label: 'Delete',
        click: () => {
          e.sender.send('tree-command-delete', { filePath: params.filePath })
        }
      }
    ])
    // show menu
    menu.popup({
      window: BrowserWindow.fromWebContents(e.sender)!
    })
  })
};