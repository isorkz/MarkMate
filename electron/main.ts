import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { registerIpcHandlers } from './ipcHandlers';
import { registerMenus } from './menus';
import { globalShortcut } from 'electron'
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    titleBarStyle: 'hiddenInset', // hidden title bar
    webPreferences: {
      // using contextBridge to expose API to the Renderer-process, instead of `nodeIntegration: true`
      // nodeIntegration: true,
      // contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      // disable webSecurity to allow loading local images
      webSecurity: false
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// app.whenReady().then(async () => {
//   // 有时候遇到每次打开都报错的异常情况, 可以通过清空缓存解决
//   await session.defaultSession.clearCache();
//   await session.defaultSession.clearStorageData();

//   createWindow();
//   registerIpcHandlers(); // 设置 IPC 处理程序
//   registerMenus();
// });

app.whenReady().then(() => {
  // For development, install DevTools Extension
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((react) => console.log(`Added Extension:  ${react.name}`))
    .catch((err) => console.log('An error occurred: ', err));

  createWindow();
  registerIpcHandlers(); // 设置 IPC 处理程序
  registerMenus();
});

// Register shortcuts when window is focused
app.on('browser-window-focus', () => {
  globalShortcut.register('CommandOrControl+S', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('save-file')
  })
  globalShortcut.register('CommandOrControl+N', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('new-tab')
  })
  globalShortcut.register('CommandOrControl+P', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('full-search')
  })
  globalShortcut.register('CommandOrControl+F', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('search-doc')
  })
  globalShortcut.register('CommandOrControl+/', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('toggle-source-editor')
  })
})

// Unregister shortcuts when window is blurred
app.on('browser-window-blur', () => {
  globalShortcut.unregister('CommandOrControl+S')
  globalShortcut.unregister('CommandOrControl+N')
  globalShortcut.unregister('CommandOrControl+P')
  globalShortcut.unregister('CommandOrControl+F')
  globalShortcut.unregister('CommandOrControl+/')
})