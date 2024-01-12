import { useEffect, useRef, MutableRefObject } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../icons'
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { TreeNode } from '../../models/FileTree'

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
  editingNodeRef: MutableRefObject<TreeNode | undefined>;
};

const TreeItem = ({
  node,
  level = 0,
  editingNodeRef,
}: TreeNodeProps) => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const setFileTree = useTreeStore((state) => state.setFileTree);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);

  const currentDocument = useStore((state) => state.currentDocument);
  const setCurrentDocument = useStore((state) => state.setCurrentDocument);

  // To focus the input element when renaming a file.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingNode && editingNode.isRenaming) {
      inputRef.current?.focus();
    }
  }, [editingNode]);

  const handleClick = () => {
    if (editingNode && editingNode.isRenaming) {
      cancelRename()
    }

    if (!node.children) {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readFile(node.path, (err: any, data: any) => {
        if (err) {
          console.error(err);
        } else {
          setCurrentDocument({
            ...currentDocument,
            filePath: node.path,
            sourceContent: data,
          });
        }
      })
    } else {
      node.isOpened = !node.isOpened;
      const newTree = JSON.parse(JSON.stringify(fileTree));
      setFileTree(newTree);
    }
  };

  const onContextMenu = (e: any) => {
    e.preventDefault();
    setEditingNode(node)
    editingNodeRef.current = node
    // show the menu
    window.ipcRenderer.send('show-file-tree-menu', { filePath: node.path });
  }

  const cancelRename = () => {
    setEditingNode(undefined);
    editingNodeRef.current = undefined;
    node.isRenaming = false;
    const newTree = JSON.parse(JSON.stringify(fileTree));
    setFileTree(newTree)
  }

  const handleRename = () => {
    if (editingNode && editingNode.isRenaming && editingNode.name && editingNode.path === node.path) {
      const dir = node.path.replace(/[^/]+$/, '');
      const newFilePath = dir + editingNode.name;
      window.api.renameFile(node.path, editingNode.name).then(() => {
        console.log('renamed file:', node.path, ' to ', newFilePath)
        // Re-render file tree
        node.name = editingNode.name;
        node.path = newFilePath;
        node.isRenaming = false;
        const newTree = JSON.parse(JSON.stringify(fileTree));
        setFileTree(newTree);
      }).catch((err: any) => {
        console.error('failed to rename file: ', node.path, ' to ', newFilePath, err)
      }).finally(() => {
        cancelRename()
      })
    }
  }

  return (
    <div>
      <div className={`flex items-center hover:bg-neutral-700 ${node.path === currentDocument?.filePath && 'bg-neutral-600'}`} style={{ paddingLeft: `${level}em` }}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        {node.children && (node.isOpened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
        {node.isRenaming && editingNode ? (
          <input type="text"
            className='bg-transparent border-b border-gray-300 focus:border-gray-300 focus:outline-none'
            ref={inputRef}
            value={editingNode.name}
            onChange={(e) => { setEditingNode({ ...editingNode, name: e.target.value }) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRename();
              }
            }}
            onBlur={() => cancelRename()} />
        ) : (
          <span className="font-medium text-gray-300">{node.name}</span>
        )}
      </div>

      {node.isOpened && node.children && node.children.map((childNode) =>
        <TreeItem node={childNode} level={level + 1} editingNodeRef={editingNodeRef} key={childNode.path} />
      )}
    </div>
  );
};

const FileTree = () => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const setFileTree = useTreeStore((state) => state.setFileTree);
  const updateTreeNode = useTreeStore((state) => state.updateTreeNode);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);

  const dirPath = useStore((state) => state.dirPath);
  const currentDocument = useStore((state) => state.currentDocument);

  // Using useRef to get the latest value for window.ipcRenderer.on function.
  const editingNodeRef = useRef(editingNode);

  const openNodeAtPath = (node: TreeNode | undefined, openedFile: string | undefined): boolean => {
    if (node && openedFile) {
      if (node.path === openedFile) {
        node.isOpened = true
        return true
      }

      if (node.children) {
        for (const child of node.children) {
          if (openNodeAtPath(child, openedFile)) {
            node.isOpened = true;
            return true;
          }
        }
      }
    }
    return false
  }

  const renameFile = (event: any, params: { filePath: string }) => {
    // using editingNodeRef to get the latest editingNode
    if (editingNodeRef.current) {
      editingNodeRef.current.isRenaming = true;
      // To re-render the tree
      updateTreeNode(editingNodeRef.current);
      // Create a new object to update editingNode
      setEditingNode({ ...editingNodeRef.current });
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
        openNodeAtPath(treeData, currentDocument?.filePath)
        setFileTree(treeData);
      });
    }
  }, [dirPath]);

  useEffect(() => {
    window.ipcRenderer.on('tree-command-rename', renameFile);
    window.ipcRenderer.on('tree-command-delete', deleteFile);

    return () => {
      window.ipcRenderer.removeListener('tree-command-rename', renameFile)
      window.ipcRenderer.removeListener('tree-command-delete', deleteFile)
    }
  }, []);

  return (
    // flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom
    <div className="flex flex-col flex-grow w-full overflow-y-auto overflow-x-hidden m-2">
      <ul>
        {fileTree?.isOpened ? <TreeItem node={fileTree} editingNodeRef={editingNodeRef} />
          : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;