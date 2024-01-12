import { ipcMain } from 'electron';
import fs from 'fs';
import dirTree from 'directory-tree';

// 使用contextBridge和ipcMain/ipcRenderer来在主进程和渲染进程之间安全地传递数据。
// 在主进程中执行需要Node.js原生模块的操作, 比如fs，然后将结果发送到渲染进程。
export const registerIpcHandlers = (): void => {
  ipcMain.handle('read-file', async (event, path: string) => {
    return fs.promises.readFile(path, 'utf8');
  });

  ipcMain.handle('read-dir-tree', async (event, path: string) => {
    // filter by md files
    return dirTree(path, { extensions: /\.md$/ });
  });

  ipcMain.handle('save-file', async (event, path: string, content: string) => {
    fs.promises.writeFile(path, content, 'utf8');
  });

  ipcMain.handle('rename-file', async (event, filePath: string, newFileName: string) => {
    fs.promises.stat(filePath).then(stats => {
      if (stats.isFile()) {
        const dir = filePath.replace(/[^/]+$/, '');
        const newPath = dir + newFileName;
        fs.promises.rename(filePath, newPath).catch(err => {
          console.error(`Failed to rename from ${filePath} to ${newPath}:`, err);
        });
      }
    }).catch(err => {
      console.error('Failed to get stat of filePath:', filePath, err);
    });
  });
};