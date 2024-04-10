import { useEffect, useRef } from 'react';
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { TreeNode } from '../../models/FileTree'
import TreeItem from './TreeItem';
import { toast } from 'react-hot-toast';

const FileTree = () => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const setFileTree = useTreeStore((state) => state.setFileTree);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);
  const pushTreeNode = useTreeStore((state) => state.pushTreeNode);
  const setEditingMode = useTreeStore((state) => state.setEditingMode);

  const dirPath = useStore((state) => state.dirPath);
  const currentDocument = useStore((state) => state.currentDocument);

  // Using useRef to get the latest value for window.ipcRenderer.on function.
  const editingNodeRef = useRef(editingNode);

  const initTreeIsOpened = (node: TreeNode | undefined, openedFile: string | undefined): boolean => {
    if (node && openedFile) {
      if (node.path === openedFile) {
        node.isOpened = true
        return true
      }

      if (node.children) {
        for (const child of node.children) {
          if (initTreeIsOpened(child, openedFile)) {
            node.isOpened = true;
            return true;
          }
        }
      }
    }
    return false
  }

  const initTreeType = (node: TreeNode | undefined) => {
    if (!node) {
      return
    }

    if (node.children) {
      node.type = 'folder'
      for (const child of node.children) {
        initTreeType(child)
      }
    } else {
      node.type = 'file'
    }
  }

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

  const deleteFile = (event: any, params: { filePath: string }) => {
    console.log('delete file: ', params.filePath)
  }

  useEffect(() => {
    console.log('[FileTree] dirPath has changed: ', dirPath)
    if (dirPath) {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readDirTree(dirPath).then((treeData: any) => {
        initTreeIsOpened(treeData, currentDocument?.filePath)
        initTreeType(treeData)
        console.log('[FileTree] tree: ', treeData)
        setFileTree(treeData);
      }).catch((err: any) => {
        console.error('Failed to read dir tree:', err);
        toast.error('Failed to read dir tree: ' + err);
      });
    }
  }, [dirPath]);

  useEffect(() => {
    window.ipcRenderer.on('tree-command-rename', renameFile);
    window.ipcRenderer.on('tree-command-newfile', newFile);
    window.ipcRenderer.on('tree-command-delete', deleteFile);

    return () => {
      window.ipcRenderer.removeListener('tree-command-rename', renameFile)
      window.ipcRenderer.removeListener('tree-command-newfile', newFile)
      window.ipcRenderer.removeListener('tree-command-delete', deleteFile)
    }
  }, []);

  return (
    // flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom
    <div className="flex flex-col flex-grow w-full overflow-y-auto overflow-x-hidden m-2">
      <ul>
        {fileTree ? <TreeItem node={fileTree} editingNodeRef={editingNodeRef} />
          : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;