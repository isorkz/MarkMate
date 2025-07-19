import { Menu, BrowserWindow, app } from 'electron'

export function createAppMenu(mainWindow: BrowserWindow, recentFiles: string[] = []) {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = []

  // App menu on macOS
  if (isMac) {
    template.push({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
  }

  // Add other menus
  template.push(

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Recent',
          submenu: recentFiles.length > 0 ? [
            ...recentFiles.map(filePath => ({
              label: filePath.split('/').pop() || filePath,
              click: () => {
                mainWindow.webContents.send('menu:open-recent-file', filePath)
              }
            })),
            { type: 'separator' as const },
            {
              label: 'Clear Recent Files',
              click: () => {
                mainWindow.webContents.send('menu:clear-recent-files')
              }
            }
          ] : [
            {
              label: 'No Recent Files',
              enabled: false
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu:save-tab')
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.webContents.send('menu:close-tab')
          }
        },
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        {
          label: 'Paste without formatting',
          accelerator: 'CmdOrCtrl+Shift+V',
          enabled: false // Just for display, TipTap handles the shortcut
        },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('menu:find-in-document')
          }
        },
        {
          label: 'Find in Files',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu:full-search')
          }
        },
        { type: 'separator' },
        // TipTap shortcuts (handled automatically by TipTap)
        // https://tiptap.dev/docs/editor/core-concepts/keyboard-shortcuts
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          enabled: false // Just for display, TipTap handles the shortcut
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          enabled: false // Just for display, TipTap handles the shortcut
        },
        {
          label: 'Underline',
          accelerator: 'CmdOrCtrl+U',
          enabled: false // Just for display, TipTap handles the shortcut
        },
        {
          label: 'Strikethrough',
          accelerator: 'CmdOrCtrl+D',
          enabled: false // Just for display, TipTap handles the shortcut
        },
        {
          label: 'Code',
          accelerator: 'CmdOrCtrl+E',
          enabled: false // Just for display, TipTap handles the shortcut
        },
        {
          label: 'Highlight',
          accelerator: 'CmdOrCtrl+H',
          enabled: false // Just for display, TipTap handles the shortcut
        }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Read Only Mode',
          type: 'checkbox',
          accelerator: 'CmdOrCtrl+R',
          click: (menuItem) => {
            mainWindow.webContents.send('menu:toggle-read-only', menuItem.checked)
          }
        },
        {
          label: 'Toggle Source Editor',
          accelerator: 'CmdOrCtrl+/',
          click: () => {
            mainWindow.webContents.send('menu:toggle-source-editor')
          }
        },
        {
          label: 'Toggle TOC',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:toggle-toc')
          }
        },
        { type: 'separator' },
        // { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ]
    },

  )

  // Window menu
  if (isMac) {
    template.push({
      role: 'windowMenu',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ]
    })
  } else {
    template.push({
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    })
  }

  // Add quit to File menu on non-Mac platforms
  if (!isMac) {
    const fileMenu = template.find(item => item.label === 'File')
    if (fileMenu && Array.isArray(fileMenu.submenu)) {
      fileMenu.submenu.push(
        { type: 'separator' },
        { role: 'quit' }
      )
    }
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}