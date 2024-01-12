import { useEffect, useState, Dispatch, SetStateAction, useRef, MutableRefObject } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../icons'
import useStore from '../../store/MStore'

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
  isOpened?: boolean;
  isRenaming?: boolean;
  newEditingName: string;
};

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
  editingNode: TreeNode | undefined;
  setEditingNode: Dispatch<SetStateAction<TreeNode | undefined>>;
  editingNodeRef: MutableRefObject<TreeNode | undefined>;
  tree: TreeNode | undefined;
  setTree: Dispatch<SetStateAction<TreeNode | undefined>>;
};

const TreeNode = ({
  node,
  level = 0,
  editingNode,
  setEditingNode,
  editingNodeRef,
  tree,
  setTree
}: TreeNodeProps) => {
  const [opened, setOpened] = useState(node.isOpened || false);
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
      return
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
      setOpened(!opened);
    }
  };

  const onContextMenu = (e: any) => {
    e.preventDefault();
    setEditingNode(node)
    editingNodeRef.current = node
    // show the menu
    window.ipcRenderer.send('show-file-tree-menu', { filePath: node.path });
  }

  const handleRename = () => {
    if (editingNode && editingNode.isRenaming && editingNode.newEditingName && editingNode.path === node.path) {
      const dir = node.path.replace(/[^/]+$/, '');
      const newFilePath = dir + editingNode.newEditingName;
      window.api.renameFile(node.path, editingNode.newEditingName).then(() => {
        console.log('renamed file:', node.path, ' to ', newFilePath)
        // Re-render file tree
        node.name = editingNode.newEditingName;
        node.path = newFilePath;
        node.isRenaming = false;
        const newTree = JSON.parse(JSON.stringify(tree));
        setTree(newTree);
      }).catch((err: any) => {
        console.error('failed to rename file: ', node.path, ' to ', newFilePath, err)
      }).finally(() => {
        setEditingNode(undefined);
        editingNodeRef.current = undefined;
      })
    }
  }

  return (
    <div>
      <div
        className={`flex items-center hover:bg-neutral-700 ${node.path === currentDocument?.filePath && 'bg-neutral-600'}`} style={{ paddingLeft: `${level}em` }}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        {node.children && (opened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
        {editingNode && editingNode.isRenaming && editingNode.path === node.path ? (
          <input type="text"
            className='bg-transparent border-b border-gray-300 focus:border-gray-300 focus:outline-none'
            ref={inputRef}
            value={editingNode.newEditingName}
            onChange={(e) => { setEditingNode({ ...editingNode, newEditingName: e.target.value }) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRename();
              }
            }}
            onBlur={() => {
              setEditingNode(undefined);
              editingNodeRef.current = undefined;
            }} />
        ) : (
          <span className="font-medium text-gray-300">{node.name}</span>
        )}
      </div>

      {opened && node.children && node.children.map((childNode) =>
        <TreeNode node={childNode} level={level + 1} editingNode={editingNode} setEditingNode={setEditingNode} editingNodeRef={editingNodeRef} tree={tree} setTree={setTree} key={childNode.path} />
      )}
    </div>
  );
};

const FileTree = () => {
  const [tree, setTree] = useState<TreeNode>();
  // Define current editing node, such as rename, delete, etc.
  const [editingNode, setEditingNode] = useState<TreeNode>();
  // Using useRef to get the latest value for window.ipcRenderer.on function.
  const editingNodeRef = useRef(editingNode);
  const dirPath = useStore((state) => state.dirPath);
  const currentDocument = useStore((state) => state.currentDocument);

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
      editingNodeRef.current.newEditingName = editingNodeRef.current.name;
      // Create a new object to update editingNode, to let the TreeNode component re-render.
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
        setTree(treeData);
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
        {tree?.isOpened ? <TreeNode node={tree} editingNode={editingNode} setEditingNode={setEditingNode} editingNodeRef={editingNodeRef} tree={tree} setTree={setTree} /> : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;