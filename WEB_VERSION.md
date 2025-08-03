# MarkMate Web Version Architecture

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

## Web Version Setup

### Quick Start

1. Setup environment variable

```bash
 for workspace path
export MARKMATE_WORKSPACE_PATH=/path/to/your/markdown/workspace

# Setup environment variable for API authentication
export MARKMATE_ACCESS_TOKEN=your-secret-access-token
```

2. Setup your git repo for markdown workspace, including github username, email, remote-url:
https://username:your_token@github.com/username/repo.git

3. Start web version

```bash
npm run dev:web
```

4. Setup `your-secret-access-token` in MarkMate settings modal.

### Environment Configuration

Create `.env` file in project root.

See `./web-server/.env.example`.
