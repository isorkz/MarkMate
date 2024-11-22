import { ipcMain } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import dirTree from 'directory-tree';
import git from 'simple-git';

export const isMac = (): boolean => {
  return os.platform().toLocaleLowerCase() === 'darwin';
}

const normalizePath = (filePath: string): string => {
  if (!isMac()) {
    return filePath.replace(/\\/g, '/');
  }
  return filePath;
}

const getImageFileName = (): string => {
  let now = Date.now();
  let date = new Date(now);

  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
  let day = date.getDate().toString().padStart(2, '0');

  let hours = date.getHours().toString().padStart(2, '0');
  let minutes = date.getMinutes().toString().padStart(2, '0');
  let seconds = date.getSeconds().toString().padStart(2, '0');

  const formattedTime = year + '-' + month + '-' + day + '_' + hours + '_' + minutes + '_' + seconds;
  return formattedTime;
}

// 使用contextBridge和ipcMain/ipcRenderer来在主进程和渲染进程之间安全地传递数据。
// 在主进程中执行需要Node.js原生模块的操作, 比如fs，然后将结果发送到渲染进程。
export const registerIpcHandlers = (): void => {
  ipcMain.handle('read-file', async (event, path: string) => {
    const data = await fs.promises.readFile(path, 'utf8');
    const stats = await fs.promises.stat(path);
    return {
      content: data,
      lastModifiedTime: stats.mtime,
    };
  });

  ipcMain.handle('read-dir-tree', async (event, path: string) => {
    async function addModificationTimeToTree(tree: any) {
      for (const item of tree.children) {
        if (!item.children) {
          const stats = await fs.promises.stat(item.path);
          item.lastModifiedTime = stats.mtime;
        } else {
          await addModificationTimeToTree(item);
        }
      }
    }

    // Filter by both md files and hidden folders
    const options = {
      extensions: /\.md$/,
      // Custom filter function to exclude hidden folders and files
      // If normalizePath is true, use '/' for all paths in both mac and windows
      normalizePath: true, // Normalize the paths for cross-platform compatibility
      exclude: /(^|\/)\.[^\/\.]/, // Exclude hidden files and folders
    };

    const tree = dirTree(path, options);
    await addModificationTimeToTree(tree);
    return tree;
  });

  ipcMain.handle('save-file', async (event, path: string, content: string) => {
    fs.promises.writeFile(path, content, 'utf8');
  });

  ipcMain.handle('rename-file', async (event, filePath: string, newFileName: string) => {
    console.log('[rename-file] filePath:', filePath, ", newFileName:", newFileName);

    const dir = path.dirname(filePath);
    let newFilePath = path.join(dir, newFileName);
    try {
      await fs.promises.rename(filePath, newFilePath);
      newFilePath = normalizePath(newFilePath);
      console.log('[rename-file] rename success: ', newFilePath);
      return newFilePath;
    } catch (err) {
      console.error(`Failed to rename from ${filePath} to ${newFilePath}:`, err);
      throw err;
    }
  });

  ipcMain.handle('new-file', async (event, dirPath: string, newFileName: string) => {
    console.log('[new-file] dirPath:', dirPath, ", newFileName:", newFileName);
    if (!dirPath || !newFileName) {
      throw new Error('Invalid dirPath or newFileName');
    }

    const stats = await fs.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error('dirPath must be a directory');
    }

    let newFilePath = path.join(dirPath, newFileName);
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
      newFilePath = normalizePath(newFilePath);
      console.log('[new-file] create success: ', newFilePath);
      return newFilePath;
    } catch (err) {
      console.error('An error occurred while creating the file:', newFilePath, err);
      throw err;
    }
  });

  ipcMain.handle('new-folder', async (event, dirPath: string, newFolderName: string) => {
    console.log('[new-folder] dirPath:', dirPath, ", newFolderName:", newFolderName);
    if (!dirPath || !newFolderName) {
      throw new Error('Invalid dirPath or newFolderName');
    }

    const stats = await fs.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error('dirPath must be a directory');
    }

    let newFolderPath = path.join(dirPath, newFolderName);
    try {
      // Check if the file already exists
      await fs.promises.access(newFolderPath);
      throw new Error('Folder already exists: ' + newFolderPath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // If the error is not 'ENOENT' (meaning the file does not exist), re-throw the error
        throw err;
      }
    }

    try {
      // Create the folder
      await fs.promises.mkdir(newFolderPath);
      newFolderPath = normalizePath(newFolderPath);
      console.log('[new-folder] create success: ', newFolderPath);
      return newFolderPath;
    } catch (err) {
      console.error('An error occurred while creating the folder:', newFolderName, err);
      throw err;
    }
  });

  ipcMain.handle('delete-file', async (event, filePath: string) => {
    console.log('[delete-file] filePath:', filePath);
    try {
      if (!isMac()) {
        // convert the path to windows path
        const isWindowsPath = /^[a-zA-Z]:\\/.test(filePath);
        if (!isWindowsPath) {
          filePath = filePath.replace(/\//g, '\\');
        }
      }
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.error('An error occurred while deleting the file:', filePath, err);
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
    const filePath = path.join(imageDir, `${getImageFileName()}.${imageType.split('/')[1]}`);
    // console.log('Saving image file: ', filePath)
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(path.join(rootDir, '.images'), { recursive: true });
    }
    await fs.promises.writeFile(filePath, buffer);

    // return the relative path of the image file
    const currentFileStats = await fs.promises.stat(currentFilePath);
    const currentFileDir = currentFileStats.isDirectory() ? currentFilePath : path.dirname(currentFilePath);
    let relativePath = path.relative(currentFileDir, filePath);
    relativePath = normalizePath(relativePath);
    return relativePath;
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
    fileUrl = normalizePath(fileUrl);
    // console.log('fileUrl: ', fileUrl);
    // Note: for ipcMain.on, use event.returnValue to return value synchronously, instead of returning the value directly.
    event.returnValue = fileUrl;
  });

  ipcMain.handle('git-sync', async (event, rootDir: string, remoteRepo: string) => {
    try {
      const simpleGit = git(rootDir);

      // Check current status
      const status = await simpleGit.status();
      if (status.files.length > 0) {
        // If there are changes, commit and push
        await simpleGit.add('./*');
        await simpleGit.commit('Update');
      }

      // Pull latest changes with rebase
      await simpleGit.pull(remoteRepo, 'main', { '--rebase': 'true' });

      // Push local commits to origin
      await simpleGit.push(remoteRepo, 'main');
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('git-status', async (event, rootDir: string) => {
    try {
      const simpleGit = git(rootDir);
      let statusResult = await simpleGit.status();
      console.log('statusResult: ', statusResult);
      return statusResult.files.length === 0 ? 'up-to-date' : 'out-of-date'
    } catch (error) {
      throw error;
    }
  });
};
