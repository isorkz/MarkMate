import { ipcMain, BrowserWindow, Menu } from 'electron';

export const registerMenus = (): void => {
  ipcMain.on('show-file-tree-menu', (e, params: {
    type: 'file' | 'folder',
    filePath: string,
  }) => {
    const menuTemplate = [];

    if (params.type === 'folder') {
      menuTemplate.push({
        label: 'New File',
        click: () => {
          e.sender.send('tree-command-newfile', { filePath: params.filePath })
        }
      });
    }

    if (params.type === 'file') {
      menuTemplate.push({
        label: 'Open in New Tab',
        click: () => {
          e.sender.send('tree-command-openfile', { filePath: params.filePath })
        }
      });
    }

    if (params.type === 'folder' || params.type === 'file') {
      menuTemplate.push({
        label: 'Rename',
        click: () => {
          e.sender.send('tree-command-rename', { filePath: params.filePath })
        }
      });
    }

    if (params.type === 'file') {
      menuTemplate.push({
        label: 'Delete',
        click: () => {
          e.sender.send('tree-command-delete', { filePath: params.filePath })
        }
      });
    }

    const menu = Menu.buildFromTemplate(menuTemplate);

    // show menu
    menu.popup({
      window: BrowserWindow.fromWebContents(e.sender)!
    })
  })
};