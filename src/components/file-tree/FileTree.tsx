import React, { useEffect, useState } from 'react';

type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
};

type TreeNodeProps = {
  node: TreeNode;
  level?: number;
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0 }) => {
  const indent = '. '.repeat(level);

  return (
    <div>
      {indent}
      {node.name}
      {node.children && node.children.map((childNode) =>
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
    <div>
      {data ? <TreeNode node={data} /> : <div>Loading...</div>}
    </div>
  );
};

export default FileTree;