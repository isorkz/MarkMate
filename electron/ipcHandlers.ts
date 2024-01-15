import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
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
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      throw new Error('filePath must be a file');
    }

    const dir = filePath.replace(/[^/]+$/, '');
    const newFilePath = dir + newFileName;
    try {
      await fs.promises.rename(filePath, newFilePath);
      return newFilePath;
    } catch (err) {
      console.error(`Failed to rename from ${filePath} to ${newFilePath}:`, err);
      throw err;
    }
  });

  ipcMain.handle('new-file', async (event, dirPath: string, newFileName: string) => {
    if (!dirPath || !newFileName) {
      throw new Error('Invalid dirPath or newFileName');
    }

    const stats = await fs.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error('dirPath must be a directory');
    }

    const newFilePath = path.join(dirPath, newFileName);
    try {
      // Check if the file already exists
      await fs.promises.access(newFilePath);
      throw new Error('File already exists: ' + newFilePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // If the error is not 'ENOENT' (meaning the file does not exist), re-throw the error
        throw err;
      }
    }

    try {
      await fs.promises.writeFile(newFilePath, '');
      return newFilePath;
    } catch (err) {
      console.error('An error occurred while creating the file:', newFilePath, err);
      throw err;
    }
  });
};