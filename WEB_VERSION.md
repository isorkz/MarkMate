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

```bash
# Setup environment variable for workspace path
export WORKSPACE_PATH=/path/to/your/markdown/workspace

# Setup your git repo, including github username, email, remote-url
# https://username:your_token@github.com/username/repo.git

# Start web version
npm run dev:web
```

### Environment Configuration

Create `.env` file in project root:

```bash
# Required: Workspace path for web version
WORKSPACE_PATH=/path/to/your/markdown/workspace

# Optional: Web server configuration  
PORT=3001
```
