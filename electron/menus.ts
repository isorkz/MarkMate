import { ipcMain, BrowserWindow, Menu } from 'electron';

export const registerMenus = (): void => {
  ipcMain.on('show-file-tree-menu', (e, params: {
    type: 'file' | 'folder',
    fileId: string,
    filePath: string,
    favorite?: boolean,
  }) => {
    const menuTemplate = [];

    if (params.type === 'folder') {
      menuTemplate.push({
        label: 'New File',
        click: () => {
          e.sender.send('tree-command-newfile', { filePath: params.filePath })
        }
      });

      menuTemplate.push({
        label: 'New Folder',
        click: () => {
          e.sender.send('tree-command-newfolder', { filePath: params.filePath })
        }
      });
    }

    if (params.type === 'file') {
      menuTemplate.push({
        label: 'Open in New Tab',
        click: () => {
          e.sender.send('tree-command-openfile-in-newtab', { fileId: params.fileId, filePath: params.filePath })
        }
      });

      menuTemplate.push({
        label: params.favorite ? 'Unfavorite' : 'Favorite',
        click: () => {
          e.sender.send(params.favorite ? 'tree-command-unfavorite' : 'tree-command-favorite', { fileId: params.fileId, filePath: params.filePath })
        }
      });
    }

    if (params.type === 'folder' || params.type === 'file') {
      menuTemplate.push({
        label: 'Rename',
        click: () => {
          e.sender.send('tree-command-rename', { fileId: params.fileId, filePath: params.filePath })
        }
      });
    }

    if (params.type === 'file') {
      menuTemplate.push({
        label: 'Delete',
        click: () => {
          e.sender.send('tree-command-delete', { fileId: params.fileId, filePath: params.filePath })
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