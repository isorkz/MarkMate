import { Text } from 'slate'

// ancestorNode is the most outer node of the current node, which is the direct child of the markdown AST root node.
export const slateNodesToMarkdownSource = (nodes: any[], preStr: string = '', ancestorNode: any = undefined, parentNode: any = undefined) => {
  let markdownSource = ''
  for (const node of nodes) {
    markdownSource += parseSlateNodeToMarkdownSource(node, preStr, ancestorNode)

    if (node.type === 'list') {
      markdownSource += '\n'
    }
  }
  return markdownSource
}

// ancestorNode is the most outer node of the current node, which is the direct child of the markdown AST root node.
const parseSlateNodeToMarkdownSource = (node: any, preStr: string = '', ancestorNode: any = undefined, parentNode: any = undefined) => {
  // Keep track of the most outer node of the current node.
  const ancestor = ancestorNode ? ancestorNode : node

  if (Text.isText(node)) {
    let text = node.text
    if (node.bold) text = '**' + text + '**'
    if (node.emphasis) text = '*' + text + '*'
    if (node.delete) text = '~~' + text + '~~'
    if (node.isInlineCode) text = '`' + text + '`'
    if (node.url) text = '[' + text + '](' + node.url + ')'
    return text
  }

  let markdownSource = ''
  switch (node.type) {
    case 'paragraph':
      if (ancestorNode && ancestorNode.type === 'blockquote') markdownSource += preStr
      markdownSource += slateNodesToMarkdownSource(node.children, preStr, ancestor, node) + '\n'
      // If current node is in a blockquote block, add '>' in the beginning of the next line.
      if (ancestorNode && ancestorNode.type === 'blockquote') markdownSource += '>'
      if (!parentNode || (parentNode.type !== 'list-item')) markdownSource += '\n'
      return markdownSource
    case 'blockquote':
      markdownSource = slateNodesToMarkdownSource(node.children, preStr + '> ', ancestor, node)
      // if it's the outermost blockquote, add a new line in the end.
      if (!ancestorNode) markdownSource += '\n'
      return markdownSource
    case 'head':
      return '#'.repeat(node.level) + ' ' + slateNodesToMarkdownSource(node.children, preStr, ancestor, node) + '\n\n'
    case 'list':
      if (node.order) {
        const start = node.start ? node.start : 1
        for (let i = 0; i < node.children.length; i++) {
          markdownSource += preStr + (start + i) + '. ' + parseSlateNodeToMarkdownSource(node.children[i], preStr, ancestorNode, node)
        }
      } else {
        for (let listItem of node.children) {
          markdownSource += preStr + '* ' + parseSlateNodeToMarkdownSource(listItem, preStr, ancestorNode, node)
        }
      }
      return markdownSource
    case 'list-item':
      for (let i = 0; i < node.children.length; i++) {
        let child = node.children[i]
        if (child.type === 'list') {
          markdownSource += parseSlateNodeToMarkdownSource(child, preStr + '  ', ancestorNode, node)
        } else {
          let checkedPrefix = ''
          if (node.checked !== undefined && node.checked !== null) {
            checkedPrefix = node.checked ? '[x] ' : '[ ] '
          }
          markdownSource += checkedPrefix + parseSlateNodeToMarkdownSource(child, preStr, ancestorNode, node)

          // Add new empty line for each child. Generally, the children including two nodes: one paragraph and one list.
          // let next_child = i < node.children.length - 1 ? node.children[i + 1] : undefined
          // if (!next_child || next_child.type === 'list') markdownSource += '\n'
        }
      }
      return markdownSource
    case 'code':
      const language = node.language !== undefined && node.language !== null ? node.language : ''
      return '```' + language + '\n' + slateNodesToMarkdownSource(node.children, preStr, ancestor, node) + '```\n\n'
    case 'code-line':
      for (let textNode of node.children) {
        markdownSource += parseSlateNodeToMarkdownSource(textNode, preStr, ancestorNode, node) + '\n'
      }
      return markdownSource
    case 'hr':
      return '---\n\n'
    case 'image':
      return '![' + (node.alt ? node.alt : '') + '](' + node.url + ')'
    case 'table':
      return parseTable(node)
    default:
      throw new Error('Unknown node type in parseSlateNodeToMarkdownSource: node.type=' + node.type + ', node=' + JSON.stringify(node))
    // not support footnoteReference, footnoteDefinition, html
  }
}

const parseTable = (tableNode: any) => {
  // Record the markdown source of each cell, so that we can get the max length of each column.
  let cellMdSources: string[][] = []
  // Record the max length of each column
  let colMaxLens: number[] = []
  for (let i = 0; i < tableNode.children.length; i++) {
    const row = tableNode.children[i]
    cellMdSources[i] = [];
    for (let j = 0; j < row.children.length; j++) {
      const cell = row.children[j]
      cellMdSources[i][j] = slateNodesToMarkdownSource(cell.children)

      // Init 
      if (colMaxLens[j] === undefined) {
        // if the align is center, the max length of the column is 5, because the markdown source of the cell is like '| :---: |'
        if (tableNode.align[j] === 'center') colMaxLens[j] = 5
        // if the align is right, the max length of the column is 5, because the markdown source of the cell is like '| ---: |'
        else if (tableNode.align[j] === 'right') colMaxLens[j] = 4
        // otherwise, the markdown source of the cell is like '| --- |'
        else colMaxLens[j] = 3
      }

      colMaxLens[j] = Math.max(colMaxLens[j], cellMdSources[i][j].length)
    }
  }

  let markdownSource = ''
  for (let i = 0; i < cellMdSources.length; i++) {
    for (let j = 0; j < cellMdSources[i].length; j++) {
      if (tableNode.align[j] === 'center') {
        markdownSource += '| ' + cellMdSources[i][j].padEnd(colMaxLens[j], ' ') + ' '
      } else if (tableNode.align[j] === 'right') {
        markdownSource += '| ' + cellMdSources[i][j].padStart(colMaxLens[j], ' ') + ' '
      } else {
        markdownSource += '| ' + cellMdSources[i][j].padEnd(colMaxLens[j], ' ') + ' '
      }
    }
    markdownSource += '|\n'

    if (i === 0) {
      for (let j = 0; j < colMaxLens.length; j++) {
        if (tableNode.align[j] === 'center') {
          markdownSource += '| :' + '-'.repeat(colMaxLens[j] - 2) + ': '
        } else if (tableNode.align[j] === 'right') {
          markdownSource += '| ' + '-'.repeat(colMaxLens[j] - 1) + ': '
        }
        else {
          markdownSource += '| ' + '-'.repeat(colMaxLens[j]) + ' '
        }
      }
      markdownSource += '|\n'
    }
  }
  return markdownSource + '\n'
}