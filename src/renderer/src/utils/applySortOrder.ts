import { FileNode } from '@shared/types/file'
import { useFileOrderStore } from '../stores/fileOrderStore'

/**
 * Apply stored custom sort order to a file tree.
 * Items with custom order are placed first in that order;
 * items not in the stored order (e.g. newly created) are appended at the end.
 */
export function applySortOrder(tree: FileNode[], workspacePath: string): FileNode[] {
  const { getOrder } = useFileOrderStore.getState()
  return applyOrderRecursive(tree, workspacePath, '', getOrder)
}

function applyOrderRecursive(
  nodes: FileNode[],
  workspacePath: string,
  parentPath: string,
  getOrder: (wp: string, pp: string) => string[] | undefined
): FileNode[] {
  // First, recursively process children of folders
  const processed = nodes.map((node) => {
    if (node.type === 'folder' && node.children) {
      return {
        ...node,
        children: applyOrderRecursive(node.children, workspacePath, node.path, getOrder)
      }
    }
    return node
  })

  // Apply custom order for this level
  const storedOrder = getOrder(workspacePath, parentPath)
  if (!storedOrder || storedOrder.length === 0) {
    return processed
  }

  const nodeMap = new Map<string, FileNode>()
  for (const node of processed) {
    nodeMap.set(node.path, node)
  }

  const ordered: FileNode[] = []
  const seen = new Set<string>()

  // Place nodes in stored order
  for (const path of storedOrder) {
    const node = nodeMap.get(path)
    if (node) {
      ordered.push(node)
      seen.add(path)
    }
  }

  // Append any new nodes not in stored order
  for (const node of processed) {
    if (!seen.has(node.path)) {
      ordered.push(node)
    }
  }

  return ordered
}
