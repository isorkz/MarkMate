import { FileTreeNode } from "../models/FileTree"
import { nanoid } from 'nanoid'

// The result of readDirTree() looks like:
// {
//   "path": "/Users/xxx/md",
//   "name": "md",
//   "children": [
//     {
//       "path": "/Users/xxx/md/my-folder",
//       "name": "my-folder",
//       "children": [
//         {
//           "path": "/Users/xxx/md/my-folder/test.md",
//           "name": "test.md",
//         }
//       ]
//     },
//   ]
// }
export class FileTreeUtils {
  // treeData is the result of readDirTree()
  static reloadAndMergeTree = (treeData: any, oldTree: FileTreeNode | undefined) => {
    let oldTreeMapByPath = new Map<string, FileTreeNode>()
    FileTreeUtils.treeToMapByPath(oldTree, oldTreeMapByPath)

    const newTree = JSON.parse(JSON.stringify(treeData))
    initTree(newTree, oldTreeMapByPath)
    return newTree
  }

  static openNodeByDfs = (node: FileTreeNode | undefined, openedFilePath: string | undefined) => {
    if (node && openedFilePath) {
      if (node.path === openedFilePath) {
        node.isOpened = true
        return true
      }

      if (node.children) {
        for (const child of node.children) {
          if (FileTreeUtils.openNodeByDfs(child, openedFilePath)) {
            node.isOpened = true;
            return true;
          }
        }
      }
    }
    return false
  }

  static treeToMapById = (node: FileTreeNode | undefined, treeMap: Map<string, FileTreeNode>) => {
    if (!node) {
      return
    }

    treeMap.set(node.id, node)

    if (node.children) {
      for (const child of node.children) {
        FileTreeUtils.treeToMapById(child, treeMap)
      }
    }
  }

  static treeToMapByPath = (node: FileTreeNode | undefined, treeMap: Map<string, FileTreeNode>) => {
    if (!node) {
      return
    }

    treeMap.set(node.path.toLowerCase(), node)

    if (node.children) {
      for (const child of node.children) {
        FileTreeUtils.treeToMapByPath(child, treeMap)
      }
    }
  }

  static getFavoriteNodes = (tree: FileTreeNode, favoriteNodes: FileTreeNode[]) => {
    if (tree.children) {
      for (const child of tree.children) {
        FileTreeUtils.getFavoriteNodes(child, favoriteNodes)
      }
    } else {
      if (tree.favorite) {
        favoriteNodes.push(tree)
      }
    }
  }
}

const initTree = (node: FileTreeNode, oldTreeMapByPath: Map<string, FileTreeNode>) => {
  if (!node) {
    return
  }

  const oldNode = oldTreeMapByPath.get(node.path.toLowerCase())
  node.id = oldNode && oldNode.id ? oldNode.id : nanoid()
  node.favorite = oldNode?.favorite

  if (node.children) {
    node.type = 'folder'

    updateTreeIndex(node.children, oldTreeMapByPath)

    for (const child of node.children) {
      initTree(child, oldTreeMapByPath)
    }
  } else {
    node.type = 'file'
  }
}

const updateTreeIndex = (children: FileTreeNode[], oldTreeMap: Map<string, FileTreeNode>) => {
  // If the old node has index, then use it, otherwise, set it to -1
  for (const child of children) {
    const oldChildNode = oldTreeMap.get(child.path.toLowerCase())
    child.index = oldChildNode ? oldChildNode.index : -1
  }

  // sort the children by index, if index is -1, then put it at the end
  children.sort((a, b) => {
    if (a.index === -1) {
      return 1
    } else if (b.index === -1) {
      return -1
    } else {
      return a.index - b.index
    }
  })

  // update the index
  for (let i = 0; i < children.length; i++) {
    children[i].index = i + 1
  }
}