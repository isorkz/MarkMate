import { useEffect, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../icons'
import useStore from '../../store/MStore'

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
  isOpened?: boolean;
};

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
};

const TreeNode = ({
  node,
  level = 0,
}: TreeNodeProps) => {
  const [opened, setOpened] = useState(node.isOpened || false);
  const currentDocument = useStore((state) => state.currentDocument);
  const setCurrentDocument = useStore((state) => state.setCurrentDocument);

  const handleClick = () => {
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
    window.ipcRenderer.send('show-file-tree-menu', { filePath: node.path })
  }

  return (
    <div>
      <div
        className={`flex items-center hover:bg-neutral-700 ${node.path === currentDocument?.filePath && 'bg-neutral-600'}`} style={{ paddingLeft: `${level}em` }}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        {node.children && (opened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
        <span className="font-medium text-gray-300">{node.name}</span>
      </div>

      {opened && node.children && node.children.map((childNode) =>
        <TreeNode node={childNode} level={level + 1} key={childNode.path} />
      )}
    </div>
  );
};

const FileTree = () => {
  const [tree, setTree] = useState<TreeNode>();
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
    console.log('rename file: ', params.filePath)
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
    window.ipcRenderer.on('rename-file', renameFile);
    window.ipcRenderer.on('delete-file', deleteFile);
  }, []);

  return (
    // flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom
    <div className="flex flex-col flex-grow w-full overflow-y-auto overflow-x-hidden m-2">
      <ul>
        {tree?.isOpened ? <TreeNode node={tree} /> : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;