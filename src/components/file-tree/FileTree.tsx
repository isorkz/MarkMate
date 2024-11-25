import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { nanoid } from 'nanoid'
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { FileTreeNode } from '../../models/FileTree'
import TreeItem from './TreeItem';

const FileTree = () => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);
  const pushTreeNode = useTreeStore((state) => state.pushTreeNode);
  const setEditingMode = useTreeStore((state) => state.setEditingMode);
  const reloadTree = useTreeStore((state) => state.reloadTree);
  const openTreeNodeByDfs = useTreeStore((state) => state.openTreeNodeByDfs);
  const removeTreeNode = useTreeStore((state) => state.removeTreeNode);
  const favoriteNodes = useTreeStore((state) => state.favoriteNodes);
  const toggleFavorite = useTreeStore((state) => state.toggleFavorite);
  const getFileNodeById = useTreeStore((state) => state.getFileNodeById);

  const rootDir = useStore((state) => state.rootDir);
  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const activeTab = useStore((state) => state.tabs[activeTabIndex]);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const getTabIdByFileId = useStore((state) => state.getTabIdByFileId);
  const newTab = useStore((state) => state.newTab);
  const removeTabByFileId = useStore((state) => state.removeTabByFileId);

  // Using useRef to get the latest value for window.ipcRenderer.on function.
  const editingNodeRef = useRef(editingNode);

  const handleNewFileStart = (event: any, params: { dirPath: string }) => {
    if (editingNodeRef.current) {
      const newNode: FileTreeNode = {
        id: nanoid(),
        name: '',
        path: editingNodeRef.current.path,  // temporary path, should be updated with file name
        type: 'file',
        index: 1, // temporary index
        lastModifiedTime: new Date(),
      }
      try {
        pushTreeNode(editingNodeRef.current.id, newNode);
        setEditingNode(newNode);
        setEditingMode('newfile')
      } catch (err) {
        console.error(`Failed to create new file in ${editingNodeRef.current.path}. ${err}`)
        toast.error(`Failed to create new file in ${editingNodeRef.current.path}. ${err}`);
      }
    }
  }

  const handleNewFolderStart = (event: any, params: { dirPath: string }) => {
    if (editingNodeRef.current) {
      const newNode: FileTreeNode = {
        id: nanoid(),
        name: '',
        path: editingNodeRef.current.path,
        type: 'folder',
        index: 1, // temporary index
        lastModifiedTime: new Date(),
        children: [],
      }
      try {
        pushTreeNode(editingNodeRef.current.id, newNode);
        setEditingNode(newNode);
        setEditingMode('newfolder')
      } catch (err) {
        console.error(`Failed to create new folder in ${editingNodeRef.current.path}. ${err}`)
        toast.error(`Failed to create new folder in ${editingNodeRef.current.path}. ${err}`);
      }
    }
  }

  const handleRenameStart = (event: any, params: { fileId: string, filePath: string }) => {
    setEditingMode('rename')
  }

  const openFileInTab = (event: any, params: { fileId: string, filePath: string }) => {
    // If the file is already opened in the tabs, only activate the tab.
    // Otherwise, read the file content and create a new tab.
    const tabId = getTabIdByFileId(params.fileId);
    if (tabId) {
      setActiveTabId(tabId)
    } else {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readFile(params.filePath, (err: any, result: any) => {
        if (!err) {
          const fileNode = getFileNodeById(params.fileId);
          if (fileNode) {
            newTab(fileNode, result.content)
            return;
          }
          err = `Failed to find file node by id: ${params.fileId}`;
        } else {
          err = `Failed to read file content from ${params.filePath}. ${err}`;
        }
        console.error(err);
        toast.error(err);
      })
    }
  }

  const deleteFile = async (event: any, params: { fileId: string, filePath: string }) => {
    try {
      await window.api.deleteFile(params.filePath);
      removeTreeNode(params.fileId)
      removeTabByFileId(params.fileId)
    } catch (err: any) {
      const errMsg = `Failed to delete file ${params.filePath}. ${err}`;
      console.error(errMsg);
      toast.error(errMsg);
    }
  }

  const toggleFavoriteFile = (event: any, params: { fileId: string, filePath: string }) => {
    toggleFavorite(params.fileId)
  }

  useEffect(() => {
    // Re-render the file tree when the active tab has changed.
    const filePath = activeTab?.fileNode.path
    if (filePath) {
      openTreeNodeByDfs(filePath)
    }
  }, [activeTab?.fileNode.id]);

  useEffect(() => {
    reloadTree(rootDir, activeTab?.fileNode.path)
  }, [rootDir]);

  useEffect(() => {
    window.ipcRenderer.on('tree-command-newfile', handleNewFileStart);
    window.ipcRenderer.on('tree-command-newfolder', handleNewFolderStart);
    window.ipcRenderer.on('tree-command-rename', handleRenameStart);
    window.ipcRenderer.on('tree-command-openfile-in-newtab', openFileInTab);
    window.ipcRenderer.on('tree-command-favorite', toggleFavoriteFile);
    window.ipcRenderer.on('tree-command-unfavorite', toggleFavoriteFile);
    window.ipcRenderer.on('tree-command-delete', deleteFile);

    return () => {
      window.ipcRenderer.removeAllListeners('tree-command-newfile')
      window.ipcRenderer.removeAllListeners('tree-command-newfolder')
      window.ipcRenderer.removeAllListeners('tree-command-rename')
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
        {favoriteNodes.map((node) =>
          <TreeItem node={node} level={1} editingNodeRef={editingNodeRef} key={`favorite-${node.id}`} isFavoriteNodeType={true} />
        )}
      </ul>

      {favoriteNodes.length > 0 && <hr className="w-full border-t-gray-500 border-t-[1px]" />}

      <ul>
        {fileTree ? <TreeItem node={fileTree} editingNodeRef={editingNodeRef} key={fileTree.id} isFavoriteNodeType={false} />
          : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;