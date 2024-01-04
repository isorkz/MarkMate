import { Text } from 'slate'

export const slateNodesToMarkdownSource = (nodes: any[]) => {
  let markdownSource = ''
  for (let node of nodes) {
    if (Text.isText(node)) {
      markdownSource += node.text
      continue
    }
    switch (node.type) {
      case 'paragraph':
        markdownSource += slateNodesToMarkdownSource(node.children) + '\n\n'
        break;
      case 'head':
        markdownSource += '#'.repeat(node.level) + ' ' + slateNodesToMarkdownSource(node.children) + '\n\n'
        break;
      case 'list':
        markdownSource += slateNodesToMarkdownSource(node.children) + '\n'
        break;
      case 'list-item':
        markdownSource += '* ' + slateNodesToMarkdownSource(node.children) + '\n'
        break;
    }
  }
  return markdownSource
}