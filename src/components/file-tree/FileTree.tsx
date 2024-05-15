import { useEffect, useRef } from 'react';
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { TreeNode } from '../../models/FileTree'
import TreeItem from './TreeItem';
import { toast } from 'react-hot-toast';

const FileTree = () => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);
  const pushTreeNode = useTreeStore((state) => state.pushTreeNode);
  const setEditingMode = useTreeStore((state) => state.setEditingMode);
  const initTree = useTreeStore((state) => state.initTree);

  const rootDir = useStore((state) => state.rootDir);
  const getActiveFilePath = useStore((state) => state.getActiveFilePath);
  const tabs = useStore((state) => state.tabs);
  const newTab = useStore((state) => state.newTab);
  const setActiveTabId = useStore((state) => state.setActiveTabId);

  // Using useRef to get the latest value for window.ipcRenderer.on function.
  const editingNodeRef = useRef(editingNode);

  const renameFile = (event: any, params: { filePath: string }) => {
    setEditingMode('rename')
  }

  const newFile = (event: any, params: { dirPath: string }) => {
    if (editingNodeRef.current) {
      const newNode: TreeNode = {
        name: '',
        path: editingNodeRef.current.path,
        type: 'file',
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

  const openFile = (event: any, params: { filePath: string }) => {
    // If the file is already opened in the tabs, only activate the tab.
    const index = tabs.findIndex((tab) => tab.filePath === params.filePath);
    if (index >= 0) {
      setActiveTabId(tabs[index].id)
    } else {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readFile(params.filePath, (err: any, data: any) => {
        if (err) {
          console.error(err);
        } else {
          newTab(params.filePath, data)
        }
      })
    }
  }

  const deleteFile = (event: any, params: { filePath: string }) => {
    console.log('delete file: ', params.filePath)
  }

  useEffect(() => {
    console.log('[FileTree] rootDir has changed: ', rootDir)
    initTree(rootDir, getActiveFilePath())
  }, [rootDir]);

  useEffect(() => {
    window.ipcRenderer.on('tree-command-rename', renameFile);
    window.ipcRenderer.on('tree-command-newfile', newFile);
    window.ipcRenderer.on('tree-command-openfile', openFile);
    window.ipcRenderer.on('tree-command-delete', deleteFile);

    return () => {
      window.ipcRenderer.removeAllListeners('tree-command-rename')
      window.ipcRenderer.removeAllListeners('tree-command-newfile')
      window.ipcRenderer.removeAllListeners('tree-command-openfile')
      window.ipcRenderer.removeAllListeners('tree-command-delete')
    }
  }, []);

  return (
    // flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom
    <div className="flex flex-col flex-grow w-full overflow-y-auto overflow-x-hidden m-2 mt-10 select-none">
      <ul>
        {fileTree ? <TreeItem node={fileTree} editingNodeRef={editingNodeRef} />
          : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;