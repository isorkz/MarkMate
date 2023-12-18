import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../Icons'

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
};

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
  isRoot?: boolean;
  setContent: Dispatch<SetStateAction<string>>;
};

const TreeNode = ({
  node,
  level = 0,
  isRoot = false,
  setContent
}: TreeNodeProps) => {
  const [opened, setOpened] = useState(isRoot);

  const handleClick = () => {
    if (!node.children) {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readFile(node.path, (err: any, data: any) => {
        if (err) {
          console.error(err);
        } else {
          setContent(data);
        }
      })
    } else {
      setOpened(!opened);
    }
  };

  return (
    <div>
      <div className="flex items-center hover:bg-neutral-700" style={{ paddingLeft: `${level}em` }} onClick={handleClick}>
        {node.children && (opened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
        <span className="font-medium text-gray-300">{node.name}</span>
      </div>

      {opened && node.children && node.children.map((childNode) =>
        <TreeNode node={childNode} level={level + 1} key={childNode.path} setContent={setContent} />
      )}
    </div>
  );
};

interface FileTreeProps {
  dirPath: string;
  setContent: Dispatch<SetStateAction<string>>;
}

const FileTree = ({
  dirPath,
  setContent,
}: FileTreeProps) => {
  const [data, setData] = useState<TreeNode | null>(null);

  useEffect(() => {
    // window.api defined in preload.ts, and implemented in ipcHandler.ts
    window.api.readDirTree(dirPath).then(setData);
  }, [dirPath]);

  return (
    // flex-grow: allow a flex item to grow and shrink as needed, then it will push the settings to the bottom
    <div className="flex flex-col flex-grow w-full overflow-y-auto overflow-x-hidden m-2">
      <ul>
        {data ? <TreeNode node={data} isRoot setContent={setContent} /> : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
}

export default FileTree;