import { ipcMain } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import dirTree from 'directory-tree';
import git from 'simple-git';

export const isMac = (): boolean => {
  return os.platform().toLocaleLowerCase() === 'darwin';
}

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

  ipcMain.handle('save-image-file', async (event, rootDir: string, currentFilePath: string, dataUrlContent: string) => {
    const match = dataUrlContent.match(/^data:(image\/\w+);base64,(.*)$/);
    if (match === null) {
      throw new Error('Invalid image dataUrlContent');
    }

    const imageType = match[1];
    const imageData = match[2];
    // decode the image data
    const buffer = Buffer.from(imageData, 'base64');
    const imageDir = path.join(rootDir, '.images');
    const filePath = path.join(imageDir, `${Date.now()}.${imageType.split('/')[1]}`);
    // console.log('Saving image file: ', filePath)
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(path.join(rootDir, '.images'), { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);

    // return the relative path of the image file
    const currentFileStats = await fs.promises.stat(currentFilePath);
    const currentFileDir = currentFileStats.isDirectory() ? currentFilePath : path.dirname(currentFilePath);
    return path.relative(currentFileDir, filePath);
  });

  // currentFilePath: the path of the current md document
  // mediaFilePath: the path of the image file
  ipcMain.on('get-file-url', (event, currentFilePath: string, mediaFilePath: string) => {
    let fileUrl = '';
    const fileHead = isMac() ? 'file://' : 'file:///';
    if (path.isAbsolute(mediaFilePath)) {
      fileUrl = fileHead + mediaFilePath
    } else {
      // If it's a relative path, get the absolute path based on the currentFileDir
      const currentFileStats = fs.statSync(currentFilePath);
      const currentFileDir = currentFileStats.isDirectory() ? currentFilePath : path.dirname(currentFilePath);
      fileUrl = fileHead + path.join(currentFileDir, mediaFilePath);
    }
    if (!isMac()) {
      fileUrl = fileUrl.replace(/\\/g, '/');
    }
    // console.log('fileUrl: ', fileUrl);
    // Note: for ipcMain.on, use event.returnValue to return value synchronously, instead of returning the value directly.
    event.returnValue = fileUrl;
  });

  ipcMain.handle('git-sync', async (event, rootDir: string, remoteRepo: string) => {
    try {
      const simpleGit = git(rootDir);
      let pullResult = await simpleGit.pull(remoteRepo, 'main');
      // console.log('pullResult: ', pullResult);
      await simpleGit.add('./*');
      await simpleGit.commit('update');
      const pushResult = await simpleGit.push(remoteRepo);
      // console.log('pushResult: ', pushResult);
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('git-status', async (event, rootDir: string) => {
    try {
      const simpleGit = git(rootDir);
      let statusResult = await simpleGit.status();
      // console.log('statusResult: ', statusResult);
      return statusResult.files.length === 0 ? 'up-to-date' : 'out-of-date'
    } catch (error) {
      throw error;
    }
  });
};
