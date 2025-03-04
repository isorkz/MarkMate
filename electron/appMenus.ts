import { app, BrowserWindow, Menu } from 'electron';

export const registerAppMenus = (): void => {
  const isMac = process.platform === 'darwin';

  const menuTemplate = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
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
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('new-tab');
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('close-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Save File',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('save-file');
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
        { type: 'separator' },
        {
          label: 'Find in Document',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('search-doc');
          }
        },
        {
          label: 'Full Search',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('full-search');
          }
        },
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Source Editor',
          accelerator: 'CmdOrCtrl+/',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('toggle-source-editor');
          }
        },
        { type: 'separator' },
        {
          label: 'Show Debug Info',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('show-debug-info');
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window menu
    {
      role: 'windowMenu', // Use the built-in role for standard Window menu functionality
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' }, // This will be shown on macOS only
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },

    // Help menu
    {
      label: 'Help',
      submenu: []
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};