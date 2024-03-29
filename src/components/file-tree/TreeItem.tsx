import { useEffect, useRef, MutableRefObject } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../icons'
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { TreeNode } from '../../models/FileTree'
import toast from 'react-hot-toast';

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
  const editingMode = useTreeStore((state) => state.editingMode);
  const reset = useTreeStore((state) => state.reset);

  const currentDocument = useStore((state) => state.currentDocument);
  const setCurrentDocument = useStore((state) => state.setCurrentDocument);

  // To focus the input element when renaming a file.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingMode && (editingMode === 'rename' || editingMode === 'newfile')) {
      inputRef.current?.focus();
    }
  }, [editingMode]);

  const handleClick = () => {
    if (editingNode) {
      if (editingNode.path === node.path) {
        return
      }
      cancelEdit()
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
    window.ipcRenderer.send('show-file-tree-menu', { type: node.type, filePath: node.path });
  }

  const handleRename = () => {
    if (editingNode && editingMode && editingMode === 'rename' && editingNode.name && editingNode.path === node.path && editingNode.name !== node.name) {
      const dir = node.path.replace(/[^/]+$/, '');
      const newFilePath = dir + editingNode.name;
      window.api.renameFile(node.path, editingNode.name).then(() => {
        console.log('renamed file:', node.path, ' to ', newFilePath)
        // Re-render file tree
        node.name = editingNode.name;
        node.path = newFilePath;
        const newTree = JSON.parse(JSON.stringify(fileTree));
        setFileTree(newTree);
      }).catch((err: any) => {
        console.error('failed to rename file: ', node.path, ' to ', newFilePath, err)
        toast.error('failed to rename file: ' + node.path + ' to ' + newFilePath + err);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleNewFile = () => {
    if (editingNode && editingMode && editingMode === 'newfile' && editingNode.name && editingNode.path === node.path) {
      let newFileName = editingNode.name;
      if (!newFileName.endsWith('.md')) {
        newFileName += '.md'
      }
      window.api.newFile(node.path, newFileName).then((newFilePath: any) => {
        // Re-render file tree
        node.name = newFileName;
        node.path = newFilePath;
        const newTree = JSON.parse(JSON.stringify(fileTree));
        setFileTree(newTree);
        console.log('Created new file:', newFilePath)
      }).catch((err: any) => {
        console.error(`Failed to create new file: ${node.path}/${newFileName}. ${err}`)
        toast.error(`Failed to create new file: ${node.path}/${newFileName}. ${err}`);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleEdit = () => {
    if (editingNode && editingMode) {
      if (editingMode === 'rename') {
        handleRename()
      } else if (editingMode === 'newfile') {
        handleNewFile()
      }
    }
  }

  const cancelEdit = () => {
    reset()
    editingNodeRef.current = undefined;
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingNode) {
      setEditingNode({ ...editingNode, name: e.target.value })
    }
  }

  return (
    <div>
      <div className={`flex items-center hover:bg-neutral-700 ${node.path === currentDocument?.filePath && 'bg-neutral-600'}`} style={{ paddingLeft: `${level}em` }}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        {node.type === 'folder' && (node.isOpened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
        {editingNode && ((editingMode === 'rename' && editingNode && editingNode.path === node.path) || (editingMode === 'newfile' && node.name === '')) ? (
          <input type="text"
            className='bg-transparent border-b border-gray-300 focus:border-gray-300 focus:outline-none'
            ref={inputRef}
            value={editingNode.name}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEdit();
              }
            }}
            onBlur={() => cancelEdit()} />
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

export default TreeItem;