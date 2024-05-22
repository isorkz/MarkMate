import { Descendant } from 'slate'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { CustomText, DefaultEmptyListItemElement, DefaultEmptySlateNodes, DefaultParagraphElement } from '../Element'

export const markdownSourceToMEditorNodes = (mdContent: string) => {
  try {
    if (!mdContent || mdContent === '') {
      return DefaultEmptySlateNodes()
    }

    let slateNodes = markdownSourceToSlateNodes(mdContent)
    if (slateNodes.length === 0) {
      slateNodes = DefaultEmptySlateNodes();
    }
    return slateNodes;
  } catch (error) {
    console.error('failed to markdownSourceToMEditorNodes: ', error)
  }
}

const markdownSourceToSlateNodes = (mdContent: string) => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  const mdast = parser.parse(mdContent)
  console.log('mdast: ', mdast)
  return markdownAstToSlateNodes(mdast.children, true)
}

// Parse markdown AST to Slate nodes.
// For markdown AST, it's a tree.
// For Slate, it's an array of nodes.
// isTop: whether the current node is the top node in the AST.
const markdownAstToSlateNodes = (mdastNodes: any[], isTop: boolean = false) => {
  let slateNodes: Descendant[] = []
  let prevNode: any = null
  for (let node of mdastNodes) {
    // handle whether need to add a new empty line between two nodes.
    if (isTop && prevNode) {
      const distance = (node.position?.start.line || 0) - (prevNode.position.end.line || 0)
      // to be consistent with slateNodesToMarkdownSource, use '>=4' here instead of '>2'.
      if (distance >= 4) {
        // const lineCount = Math.floor(distance / 2)
        const lineCount = Math.floor((distance - 2) / 2)
        for (let i = 0; i < lineCount; i++) {
          slateNodes.push(DefaultParagraphElement())
        }
      }
    }

    switch (node.type) {
      case 'paragraph':
        slateNodes.push({
          type: 'paragraph',
          children: node.children && node.children.length > 0 ? markdownAstToSlateNodes(node.children) : [{ text: '' }],
        })
        break;
      case 'heading':
        slateNodes.push({
          type: 'head',
          level: node.depth,
          children: node.children && node.children.length > 0 ? markdownAstToSlateNodes(node.children) : [{ text: '' }],
        })
        break;
      case 'list':
        slateNodes.push({
          type: 'list',
          order: node.ordered,
          start: node.start,
          children: node.children && node.children.length > 0 ? markdownAstToSlateNodes(node.children) : [DefaultEmptyListItemElement()],
        })
        break;
      case 'listItem':
        slateNodes.push({
          type: 'list-item',
          checked: node.checked,
          children: node.children && node.children.length > 0 ? markdownAstToSlateNodes(node.children) : [DefaultParagraphElement()],
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
          children: node.children && node.children.length > 0 ? markdownAstToSlateNodes(node.children) : [DefaultParagraphElement()],
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

    prevNode = node
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
      if (slateCustomText.url && slateCustomText.url.length > 0) {
        slateCustomText.url = astNode.url
      } else {
        // for text like '[]()', the parser will treat it as a link, convert it back to the original text.
        if (astNode.children) {
          for (let child of astNode.children) {
            parseLeafElement(child, slateCustomText)
          }
        }
        slateCustomText.text = '[' + slateCustomText.text + ']()'
        return slateCustomText
      }
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
    } else if (node.type === 'link') {
      if (node.url && node.url.length > 0) {
        let slateCustomText: CustomText = { text: '' }
        slateTextNodes.push(parseLeafElement(node, slateCustomText))
        slateTextNodes.push({ text: '[' + node.children[0].value + '](' + node.url + ')' })
      } else {
        // for the text like '[]()', the parser will treat it as a link, convert it back to the original text.
        let slateCustomText: CustomText = { text: '' }
        slateCustomText = parseLeafElement(node, slateCustomText)
        slateCustomText.text = '[' + slateCustomText.text + ']()'
        slateTextNodes.push(slateCustomText)
      }
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