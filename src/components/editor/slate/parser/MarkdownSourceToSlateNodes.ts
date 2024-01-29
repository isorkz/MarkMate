import { Descendant } from 'slate'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { CustomText } from '../Element'

export const markdownSourceToSlateNodes = (mdContent: string) => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  const mdast = parser.parse(mdContent)
  console.log('mdast: ', mdast)
  return markdownAstToSlateNodes(mdast.children)
}

// Parse markdown AST to Slate nodes.
// For markdown AST, it's a tree.
// For Slate, it's an array of nodes.
const markdownAstToSlateNodes = (mdastNodes: any[]) => {
  let slateNodes: Descendant[] = []
  for (let node of mdastNodes) {
    switch (node.type) {
      case 'paragraph':
        slateNodes.push({
          type: 'paragraph',
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'heading':
        slateNodes.push({
          type: 'head',
          level: node.depth,
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'list':
        slateNodes.push({
          type: 'list',
          order: node.ordered,
          start: node.start,
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'listItem':
        slateNodes.push({
          type: 'list-item',
          checked: node.checked,
          children: markdownAstToSlateNodes(node.children),
        });
        break;
      case 'code':
        slateNodes.push({
          type: 'code',
          language: node.lang,
          children: node.value.split('\n').map((line: string, index: number) => {
            return {
              type: 'code-line',
              num: index,
              children: [{ text: line }],
            }
          }),
        })
        break;
      case 'image':
        slateNodes.push({
          type: 'image',
          alt: node.alt,
          url: decodeURIComponent(node.url),
          children: [{ text: '' }],
        })
        break;
      case 'blockquote':
        slateNodes.push({
          type: 'blockquote',
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'table':
        slateNodes.push({
          type: 'table',
          align: node.align,
          children: node.children.map((row: any, i: number) => {
            return {
              type: 'table-row',
              children: row.children.map((cell: any, j: number) => {
                return {
                  type: 'table-cell',
                  // Treat the first row as the table header.
                  isFirstRow: i === 0,
                  align: node.align[j],
                  children: markdownAstToSlateNodes(cell.children),
                }
              }),
            }
          }),
        });
        break;
      case 'tableRow':
        slateNodes.push({
          type: 'table-row',
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'tableCell':
        slateNodes.push({
          type: 'table-cell',
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'thematicBreak':
        slateNodes.push({
          type: 'hr',
          children: [{ text: '' }]
        })
        break;
      case 'break':
        slateNodes.push({
          text: '\n'
        })
        break;
      case 'footnoteReference':
        slateNodes.push({
          type: 'footnoteReference',
          identifier: node.identifier,
          label: node.label,
          children: [{ text: '' }],
        })
        break;
      case 'footnoteDefinition':
        slateNodes.push({
          type: 'footnoteDefinition',
          identifier: node.identifier,
          label: node.label,
          children: [{ text: '' }],
        })
        break;
      case 'html':
        slateNodes.push({
          type: 'html',
          value: node.value,
          children: [{ text: '' }],
        })
        break;
      default:
        if (['strong', 'link', 'text', 'emphasis', 'delete', 'inlineCode'].includes(node.type)) {
          let slateCustomText: CustomText = { text: '' }
          slateNodes.push(parseLeafElement(node, slateCustomText))
        } else {
          console.error(`Unknown node type in markdownAstToSlateNodes: ${JSON.stringify(node)}`);
        }
    }
  }

  return slateNodes
}

const parseLeafElement = (astNode: any, slateCustomText: CustomText) => {
  switch (astNode.type) {
    case 'text':
      slateCustomText.text = astNode.value
      break;
    case 'strong':
      slateCustomText.bold = true
      break;
    case 'emphasis':
      slateCustomText.emphasis = true
      break;
    case 'delete':
      slateCustomText.delete = true
      break;
    case 'link':
      slateCustomText.url = astNode.url
      break;
    case 'inlineCode':
      slateCustomText.isInlineCode = true
      slateCustomText.text = astNode.value
      break;
    case 'html':
      slateCustomText.text = astNode.value
      break;
    default:
      console.error(`Unknown node type in parseLeafElements: ${JSON.stringify(astNode)}`);
  }

  if (astNode.children) {
    for (let child of astNode.children) {
      parseLeafElement(child, slateCustomText)
    }
  }
  return slateCustomText
}

// ! Deprecated !
// This function treats all types of nodes in the markdown AST as custom text nodes in Slate.
// This is used when we don't want to format the markdown AST to Slate nodes, but just want to parse the markdown AST to a string.
// For example, for markdown source '* # testhead', the markdown AST is: { type: 'listItem', children: [{ type: 'heading', children: [{ type: 'text', value: 'head1' }] }] }.
// But in this case, we don't want the value '# testhead' to be treated as heading type.
const markdownAstToSlateCustomTextNodes = (mdastNodes: any[], slateTextNodes: CustomText[]) => {
  for (let node of mdastNodes) {
    if (['strong', 'link', 'text', 'emphasis', 'delete', 'inlineCode'].includes(node.type)) {
      let slateCustomText: CustomText = { text: '' }
      slateTextNodes.push(parseLeafElement(node, slateCustomText))
    } else if (node.type === 'break') {
      slateTextNodes.push({ text: '\n' })
    } else if (['footnoteReference', 'footnoteDefinition'].includes(node.type)) {
      slateTextNodes.push({ text: node.label })
    } else if (node.type === 'html') {
      slateTextNodes.push({ text: node.value })
    } else if (node.type === 'listItem') {
      let slateCustomText: CustomText = { text: '* ' }
      slateTextNodes.push(parseLeafElement(node, slateCustomText))
    } else if (node.type === 'heading') {
      slateTextNodes.push({ text: '#'.repeat(node.depth) + ' ' })
      markdownAstToSlateCustomTextNodes(node.children, slateTextNodes)
    } else if (['paragraph', 'heading', 'list', 'code', 'image', 'blockquote', 'table', 'tableRow', 'tableCell', 'thematicBreak'].includes(node.type)) {
      markdownAstToSlateCustomTextNodes(node.children, slateTextNodes)
    } else {
      console.error(`Unknown node type in markdownAstToSlateCustomTextNodes: ${JSON.stringify(node)}`);
    }
  }
}