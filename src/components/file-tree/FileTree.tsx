import React, { useEffect, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '../Icons'

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
};

type TreeNodeProps = {
  node: TreeNode;
  level?: number;
  isRoot?: boolean;
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0, isRoot = false }) => {
  const [opened, setOpened] = useState(isRoot);

  const handleToggle = () => {
    setOpened(!opened);
  };

  return (
    <div>
      <div className="flex items-center hover:bg-neutral-700" style={{ paddingLeft: `${level}em` }} onClick={handleToggle}>
        {node.children && (opened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
        <span className="font-medium text-gray-300">{node.name}</span>
      </div>

      {opened && node.children && node.children.map((childNode) =>
        <TreeNode node={childNode} level={level + 1} key={childNode.path} />
      )}
    </div>
  );
};

const FileTree: React.FC<{ dirPath: string }> = ({ dirPath }) => {
  const [data, setData] = useState<TreeNode | null>(null);

  useEffect(() => {
    window.api.readDirTree(dirPath).then(setData);
  }, [dirPath]);

  return (
    <div className="m-2">
      <ul>
        {data ? <TreeNode node={data} isRoot /> : <div className="p-5 text-center text-gray-500">Loading...</div>}
      </ul>
    </div>
  );
};

export default FileTree;