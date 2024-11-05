import { useEffect, useRef } from 'react';
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { TreeNode } from '../../models/FileTree'
import TreeItem from './TreeItem';
import { toast } from 'react-hot-toast';
import { nanoid } from 'nanoid'

const FileTree = () => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);
  const pushTreeNode = useTreeStore((state) => state.pushTreeNode);
  const setEditingMode = useTreeStore((state) => state.setEditingMode);
  const loadTree = useTreeStore((state) => state.loadTree);
  const openFileItem = useTreeStore((state) => state.openFileItem);
  const removeTreeNode = useTreeStore((state) => state.removeTreeNode);
  const favoriteFiles = useTreeStore((state) => state.favoriteFiles);
  const toggleFavoriteTreeNode = useTreeStore((state) => state.toggleFavoriteTreeNode);
  const reset = useTreeStore((state) => state.reset);

  const rootDir = useStore((state) => state.rootDir);
  const getActiveFilePath = useStore((state) => state.getActiveFilePath);
  const tabs = useStore((state) => state.tabs);
  const newTab = useStore((state) => state.newTab);
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const removeTabByFilePath = useStore((state) => state.removeTabByFilePath);

  // Using useRef to get the latest value for window.ipcRenderer.on function.
  const editingNodeRef = useRef(editingNode);

  const renameFile = (event: any, params: { fileId: string, filePath: string }) => {
    setEditingMode('rename')
  }

  const newFile = (event: any, params: { dirPath: string }) => {
    if (editingNodeRef.current) {
      const newNode: TreeNode = {
        id: nanoid(),
        name: '',
        path: editingNodeRef.current.path,
        type: 'file',
        index: 1, // temporary index
        lastModifiedTime: new Date(),
      }
      try {
        pushTreeNode(editingNodeRef.current.path, newNode);
        setEditingNode(newNode);
        setEditingMode('newfile')
      } catch (err) {
        console.error(`Failed to create new file in ${editingNodeRef.current.path}. ${err}`)
        toast.error(`Failed to create new file in ${editingNodeRef.current.path}. ${err}`);
      }
    }
  }

  const openFile = (event: any, params: { fileId: string, filePath: string }) => {
    // If the file is already opened in the tabs, only activate the tab.
    const index = tabs.findIndex((tab) => tab.filePath === params.filePath);
    if (index >= 0) {
      setActiveTabId(tabs[index].id)
    } else {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readFile(params.filePath, (err: any, result: any) => {
        if (err) {
          console.error(err);
        } else {
          const lastModifiedTime = new Date(result.lastModifiedTime);
          newTab(params.fileId, params.filePath, result.content, lastModifiedTime)
        }
      })
    }
  }

  const toggleFavoriteFile = (event: any, params: { fileId: string, filePath: string }) => {
    toggleFavoriteTreeNode(params.fileId)
    reset()
  }

  const deleteFile = (event: any, params: { fileId: string, filePath: string }) => {
    window.api.deleteFile(params.filePath).then(() => {
      removeTreeNode(params.fileId)
      removeTabByFilePath(params.filePath)
    }).catch((err: any) => {
      console.error(err);
      toast.error(`Failed to delete file ${params.filePath}. ${err}`);
    })
  }

  useEffect(() => {
    // Re-render the file tree when the active tab has changed.
    const filePath = getActiveFilePath()
    if (filePath) {
      openFileItem(filePath)
    }
  }, [tabs[activeTabIndex].filePath]);

  useEffect(() => {
    loadTree(rootDir, getActiveFilePath())
  }, [rootDir]);

  useEffect(() => {
    window.ipcRenderer.on('tree-command-rename', renameFile);
    window.ipcRenderer.on('tree-command-newfile', newFile);
    window.ipcRenderer.on('tree-command-openfile-in-newtab', openFile);
    window.ipcRenderer.on('tree-command-favorite', toggleFavoriteFile);
    window.ipcRenderer.on('tree-command-unfavorite', toggleFavoriteFile);
    window.ipcRenderer.on('tree-command-delete', deleteFile);

    return () => {
      window.ipcRenderer.removeAllListeners('tree-command-rename')
      window.ipcRenderer.removeAllListeners('tree-command-newfile')
      window.ipcRenderer.removeAllListeners('tree-command-openfile-in-newtab')
      window.ipcRenderer.removeAllListeners('tree-command-favorite')
      window.ipcRenderer.removeAllListeners('tree-command-unfavorite')
      window.ipcRenderer.removeAllListeners('tree-command-delete')
    }
  }, []);

  return (
    // flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom
    <div className="flex flex-col flex-grow w-full overflow-y-auto overflow-x-hidden m-2 mt-10 select-none">
      <ul>
        {favoriteFiles.map((node) =>
          <TreeItem node={node} level={1} editingNodeRef={editingNodeRef} key={node.id} />
        )}
      </ul>

      {favoriteFiles.length > 0 && <hr className="w-full border-t-gray-500 border-t-[1px]" />}

      <ul>
        {fileTree ? <TreeItem node={fileTree} editingNodeRef={editingNodeRef} />
          : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;