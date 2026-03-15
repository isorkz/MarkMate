# File Tree Drag-and-Drop Sorting

## Overview

The left sidebar file tree supports two drag-and-drop behaviors:

1. **Reorder** — Drag files/folders to change their display order within the same directory level.
2. **Move into folder** — Drag a file/folder onto a folder to move it inside.

Custom sort order is persisted in `localStorage` per workspace, so it survives app restarts.

## How It Works

### Pointer Position Zones

The behavior is determined by **where the pointer is** on the drop target when you release:

```
┌──────────────────────────┐
│  Top 30%   → insert BEFORE (reorder)
├──────────────────────────┤
│  Center 40% → move INTO folder (only for folders)
├──────────────────────────┤
│  Bottom 30% → insert AFTER (reorder)
└──────────────────────────┘
       Folder drop target

┌──────────────────────────┐
│  Top 50%   → insert BEFORE (reorder)
├──────────────────────────┤
│  Bottom 50% → insert AFTER (reorder)
└──────────────────────────┘
       File drop target
```

### Visual Indicators

- **Blue line** (top or bottom edge) — reorder insertion point
- **Blue highlight** (entire row) — will move into this folder
- **Drag overlay** — floating card showing the dragged item's name and icon

## Architecture

### Key Files

| File | Role |
|------|------|
| `components/file/DraggableFileNode.tsx` | Combines `useDraggable` + `useDroppable` on each tree node; renders visual indicators |
| `components/file/FileTree.tsx` | `DndContext` setup, `onDragMove` zone computation, `handleDragEnd` action dispatch |
| `stores/fileOrderStore.ts` | Zustand store persisting custom sort order per workspace in `localStorage` |
| `utils/applySortOrder.ts` | Merges filesystem tree (alphabetical) with stored custom order |
| `utils/fileOperations.ts` | `loadFileTree()` applies stored order after reading from disk |
| `stores/fileSystemStore.ts` | Subscribes to path rename/delete events and propagates to `fileOrderStore` |

### Data Flow

```
Filesystem (alphabetical)
        │
        ▼
WorkspaceService.getFileTree()   ← reads disk, sorts alphabetically
        │
        ▼
applySortOrder()                 ← reorders based on stored custom order
        │
        ▼
fileSystemStore.fileTree         ← React state driving the UI
        │
        ▼
FileTree → DraggableFileNode     ← renders each node with drag-drop behavior
```

### Sort Order Persistence

**Store**: `fileOrderStore` (Zustand + `persist` middleware)
**localStorage key**: `file-order-storage`

Data structure:
```typescript
// workspacePath → parentFolderPath → ordered child paths
Record<string, Record<string, string[]>>
```

- Root-level items use `''` (empty string) as the parent key.
- Only folders with a custom order have an entry. If no entry exists, alphabetical order is used.
- New files (not in the stored order) appear at the end.
- Deleted/renamed files are automatically cleaned up via path event subscriptions.

### Drag-and-Drop Implementation

Built on `@dnd-kit/core` (already used by the project). **Does NOT use `@dnd-kit/sortable`** — items stay in place during drag for stable folder targeting.

Each tree node has two dnd-kit hooks on the **same DOM element**:

```typescript
useDraggable({ id: node.path, data: { node } })
useDroppable({ id: `drop:${node.path}`, data: { node }, disabled: isDragging })
```

Key detail: `disabled: isDragging` prevents the dragged item's own droppable zone from capturing the pointer (since it moves with the dragged element).

### Event Handling

1. **`onDragMove`** (fires on every pointer movement)
   - Computes `pointerY` relative to the `over` element's rect
   - Determines the zone (before / inside / after)
   - Updates `dropIndicator` state for visual feedback

2. **`handleDragEnd`** (fires on drop)
   - **Independently recomputes** the zone from the event's `activatorEvent.clientY + delta.y` and `over.rect` — does NOT rely on React state to avoid stale closure issues
   - Dispatches action:
     - `inside` + folder → `handleMoveFile()` (move into folder)
     - `before` / `after` + same parent → `reorderAtPosition()` (reorder siblings)
     - `before` / `after` + different parent → `handleMoveFile()` (move to target's parent)
     - `root` → `handleMoveFile()` (move to workspace root)

### Collision Detection

Uses `closestCenter` from `@dnd-kit/core`. Measures Euclidean distance from the active element's center (at pointer position) to each droppable's center. The closest droppable becomes the `over` target.

`RootDropZone` wraps the entire file list and acts as a fallback drop target for moving items to the workspace root.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Drag file onto sibling folder (center zone) | Move into folder |
| Drag folder onto sibling folder (center zone) | Move into folder |
| Drag item onto folder edge (top/bottom zone) | Reorder |
| Create new file | Appended at end of parent's order |
| Delete file | Removed from stored order |
| Rename file/folder | Path updated in stored order |
| Move file to different folder | Removed from source order, appended in target |
| No custom order stored | Falls back to alphabetical (folders first) |
| App restart | Order restored from `localStorage` |
