# MarkMate Web Version

## Web Version Setup

### Quick Start

1. Setup environment variable

For MarkMate web version, workspace path and access key are required:
* Workspace path must be specified in the environment variable for web version.
* Access key is used for API authentication.

```bash
export MARKMATE_WEB_WORKSPACE_PATH=/path/to/your/markdown/workspace

export MARKMATE_WEB_ACCESS_KEY=your-web-access-key
```

Or you can create a `.env` file and edit it:

```bash
cp web-server/.env.example web-server/.env
```

2. Setup your git repo for markdown workspace, including github username, email, remote-url:
https://username:your_token@github.com/username/repo.git

3. Start web version

```bash
# For DEV
npm run dev:web

# For PROD
npm run build:web-frontend
npm run build:web
npm run start:web
```

4. Setup `your-secret-access-token` in MarkMate settings modal.

## Layered Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React App)                    │
│                 Completely Reusable, No Changes            │
│                                                            │
│  Components: Editor, FileTree, Settings...                │
│  Stores: editorStore, fileSystemStore, workspaceStore     │
│  Hooks: useAutoSave, useFileSearch...                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┼───────────────────────────────────────────┐
│            Adapter Layer (Thin Wrapper)                   │
│                  │                                         │
│  ElectronAdapter │  WebAdapter                            │
│   (IPC calls)    │   (HTTP calls)                         │
│                  │                                         │
│  ┌─────────────┐ │ ┌─────────────┐                        │
│  │ ipcRenderer │ │ │ fetch API   │                        │
│  │   .invoke   │ │ │   calls     │                        │
│  └─────────────┘ │ └─────────────┘                        │
└─────────────────┼───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│         Business Logic Services (Core Reuse Layer)        │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ GitService  │ │ FileService │ │ WorkspaceService    │   │
│  │             │ │             │ │                     │   │
│  │ syncRepo    │ │ readFile    │ │ getFileTree        │   │
│  │ getHistory  │ │ writeFile   │ │ validateWorkspace  │   │
│  │ checkStatus │ │ deleteFile  │ │ createDirectory    │   │
│  │ restoreFile │ │ renameFile  │ │ ...                │   │
│  │ ...         │ │ ...         │ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────┼───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Runtime Environment                           │
│                                                            │
│  Desktop Mode          │         Web Mode                 │
│  ┌─────────────────┐   │   ┌─────────────────────────┐    │
│  │ Electron Main   │   │   │ Express.js Server       │    │
│  │ Process         │   │   │                         │    │
│  │                 │   │   │ API Routes:             │    │
│  │ IPC Handlers ───┼───┼───│ /api/git/*             │    │
│  │ • git:sync      │   │   │ /api/file/*            │    │
│  │ • file:read     │   │   │ /api/workspace/*       │    │
│  │ • workspace:*   │   │   │                         │    │
│  └─────────────────┘   │   └─────────────────────────┘    │
│                        │                                  │
│         Node.js FS API + simple-git + Path Utils         │
└────────────────────────────────────────────────────────────┘
```