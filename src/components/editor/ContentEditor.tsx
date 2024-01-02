import { useState, useCallback, useMemo, Dispatch, SetStateAction, useEffect, MouseEventHandler } from 'react'
import { BaseEditor, Descendant, Editor, Transforms, createEditor, Element as SlateElement, Text, Range, Point, Path } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, ReactEditor, withReact } from 'slate-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

interface ContentEditorProps {
  mdSourceContent: string;
  setMdSourceContent: Dispatch<SetStateAction<string>>;
}

// Define my own types and properties for Slate nodes.
// Slate wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
type ParagraphElement = { type: 'paragraph', children: Descendant[], checked?: boolean }
type HeadElement = { type: 'head', children: Descendant[], level?: number }
type ListElement = { type: 'list', children: Descendant[], order?: boolean }
type ListItemElement = { type: 'list-item', children: Descendant[], checked?: boolean }
type CodeElement = { type: 'code', children: Descendant[], language?: string, render?: boolean }
type CodeInlineElement = { type: 'code-line', children: Descendant[], num?: number }
type ImageElement = { type: 'image', url: string, children: Descendant[] }
// type LinkElement = { type: 'link', url: string, children: Descendant[] }
type HrElement = { type: 'hr', children: Descendant[] }   // Element must have children property, even though HrElement doesn't need it. Otherwise it will throw exceptions for Transforms.insertNodes.
type BlockQuoteElement = { type: 'blockquote', children: Descendant[] }
type TableElement = { type: 'table', children: Descendant[] }
type TableRowElement = { type: 'table-row', children: Descendant[] }
type TableCellElement = { type: 'table-cell', children: Descendant[], isFirstRow?: boolean }
type FootnoteReferenceElement = { type: 'footnoteReference', identifier?: string, label?: string, children: Descendant[] }
type FootnoteDefinitionElement = { type: 'footnoteDefinition', identifier?: string, label?: string, children: Descendant[] }
type HtmlElement = { type: 'html', value: string, children: Descendant[] }

type CustomText = {
  text: string,
  isInlineCode?: boolean,
  url?: string,
  bold?: boolean,
  emphasis?: boolean,
  delete?: boolean,
  html?: boolean,
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: ParagraphElement | HeadElement | ListElement | ListItemElement | CodeElement | CodeInlineElement | ImageElement
    | BlockQuoteElement | TableElement | TableRowElement | TableCellElement | HrElement | FootnoteReferenceElement | FootnoteDefinitionElement | HtmlElement
    Text: CustomText
  }
}

const markdownSourceToSlateNodes = (mdContent: string) => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  const mdast = parser.parse(mdContent)
  return markdownAstToSlateNodes(mdast.children)
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
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'listItem':
        slateNodes.push({
          type: 'list-item',
          checked: node.checked,
          children: markdownAstToSlateNodes(node.children),
        })
        break;
      case 'code':
        slateNodes.push({
          type: 'code',
          language: node.lang,
          render: node.meta === 'render',
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
          children: node.children.map((row: any, i: number) => {
            return {
              type: 'table-row',
              children: row.children.map((cell: any, j: number) => {
                return {
                  type: 'table-cell',
                  // Treat the first row as the table header.
                  isFirstRow: i === 0,
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
          console.error(`Unknown node type in mdastToSlate: ${JSON.stringify(node)}`);
        }
    }
  }

  return slateNodes
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'paragraph':
      return <p {...attributes}>{children}</p>
    case 'head':
      const Head = `h${element.level}`;
      return <Head {...attributes}>{children}</Head>
    case 'list':
      if (element.order) return <ol {...attributes}>{children}</ol>
      else return <ul {...attributes}>{children}</ul>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'image':
      return <img src={element.url}></img>
    case 'code':
      let language = element.language || 'text'
      if (element.language === 'c++') {
        language = 'cpp'
      }
      return (
        <div style={{ position: 'relative' }}>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              overflowX: 'auto',
              borderRadius: '5px',
              // minWidth: '100px',
              // maxWidth: '600px',
              // width: '300px',
            }}
            className={"MarkMateCodeBlocks"}
            children={element.children.map((item: any) => item.children[0]?.text).join('\n')} />
          {/* show the language name on the top right corner. */}
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            padding: '5px',
            color: '#aaa',
            fontSize: '12px',
          }}>
            {language}
          </div>
        </div>
      )
    case 'blockquote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'hr':
      return <hr />
    case 'table':
      const head = children[0];  // 第一行作为表头
      const body = children.slice(1);  // 其他行作为表体
      return (
        <table {...attributes}>
          <thead>{head}</thead>
          <tbody>{body}</tbody>
        </table>
      );
    case 'table-row':
      return <tr {...attributes}>{children}</tr>
    case 'table-cell':
      if (element.isFirstRow) return <th {...attributes}>{children}</th>
      else return <td {...attributes}>{children}</td>
    default:
      return <div {...attributes}>{children}</div>
  }
}

const Leaf = (props: RenderLeafProps) => {
  let children = <>{props.children}</>
  if (props.leaf.url) {
    children = <a href={props.leaf.url} className='underline'>{children}</a>
  }
  if (props.leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (props.leaf.emphasis) {
    children = <em>{children}</em>
  }
  if (props.leaf.delete) {
    children = <del>{children}</del>
  }
  if (props.leaf.isInlineCode) {
    children = <code>{children}</code>
  }
  return <span {...props.attributes}>{children}</span>
}

const SHORTCUTS = {
  '*': { type: 'list-item' },
  '-': { type: 'list-item' },
  '+': { type: 'list-item' },
  '>': { type: 'blockquote' },
  '#': { type: 'head', level: 1 },
  '##': { type: 'head', level: 2 },
  '###': { type: 'head', level: 3 },
  '####': { type: 'head', level: 4 },
  '#####': { type: 'head', level: 5 },
  '######': { type: 'head', level: 6 },
}

const withMarkdownShortcuts = (editor: Editor) => {
  // insertText is a built-in function of Editor to insert text.
  const { insertText, deleteBackward, insertBreak } = editor;

  // Override the insertText method to handle our custom logic
  editor.insertText = (text) => {
    // In slate, 'selection' is a range, which is a tuple of two points: 'anchor' and 'focus'.
    // 'anchor' is the point where the user started the selection, and 'focus' is the point where the user ended the selection.
    // If the user has not selected anything, then 'anchor' and 'focus' will be the same, and the selection will be collapsed, or it's 'cursor'.
    // 'anchor' and 'focus' are both objects with 'path' and 'offset' properties.
    // - 'path' is an array of indexes into the document, describing a path of nodes to get from the root to the current node.
    // - 'offset' is the character offset at which the selection begins or ends in the current node.
    const { selection } = editor;

    // If the user is typing the markdown shortcuts at the beginning of a block, autoformat it.
    if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      // Get the ancestor block element of the current selection.
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range) + text.slice(0, -1)
      const element = SHORTCUTS[beforeText]

      if (element) {
        Transforms.select(editor, range)

        if (!Range.isCollapsed(range)) {
          Transforms.delete(editor)
        }

        Transforms.setNodes<SlateElement>(editor, element, {
          match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        })

        if (element.type === 'list-item') {
          // Also insert a new parent node to act as the list container
          const list: ListElement = {
            type: 'list',
            children: [],
          }
          Transforms.wrapNodes(editor, list, {
            match: n =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === 'list-item',
          })
        }

        return
      }
    }

    // If user is not typing a markdown shortcut, just insert the text as usual.
    insertText(text)
  }

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection) {
      // Editor.nodes to get all the nodes in the current selection.
      // [node] is to get the first node in the array. It's a tuple of [node, path], where 'node' is the node itself, and 'path' is the path of the node.
      const [node] = Editor.nodes<SlateElement>(editor, {
        match: n => SlateElement.isElement(n),
        // mode: 'highest' will return the highest matching node, which is the parent node of the current selection.
        // mode: 'lowest' will return the lowest matching node, which is the current selection itself.
        mode: 'lowest'
      })

      if (SlateElement.isElement(node[0])) {
        switch (node[0].type) {
          case 'head':
            // Create a new paragraph after the current head. Otherwise, it will continue to be a head.
            Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
            return;
          case 'list-item':
            // If the current list item is empty, remove it and insert a new paragraph after the list.
            if (node[0].children.length === 1 && Text.isText(node[0].children[0]) && node[0].children[0].text === '') {
              const path = node[1]
              const [parentNode, parentPath] = Editor.parent(editor, path)
              if (SlateElement.isElement(parentNode) && parentNode.type === 'list') {
                Transforms.removeNodes(editor, { at: path })
                Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: Path.next(parentPath) })
                // Set the cursor to the start of the new paragraph
                Transforms.select(editor, Editor.start(editor, Path.next(parentPath)))
                return;
              }
            }
        }
      }
    }
    insertBreak();
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: 'paragraph',
          }
          Transforms.setNodes(editor, newProperties)

          if (block.type === 'list-item') {
            Transforms.unwrapNodes(editor, {
              match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === 'list',
              split: true,
            })
          }

          return
        }
      }

      deleteBackward(...args)
    }
  }

  return editor
}

const ContentEditor = ({
  mdSourceContent,
  setMdSourceContent,
}: ContentEditorProps) => {
  // Rich text editor: Slate, wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
  // withMarkdownShortcuts: is a custom plugin to modify the editor's behavior. Example: https://github.com/ianstormtaylor/slate/blob/main/site/examples/markdown-shortcuts.tsx
  const editor = useMemo(() => withMarkdownShortcuts(withReact(createEditor())), [])
  // Descendant类型在Slate中是一个广义的节点类型，它可以是一个元素节点，也可以是一个文本节点(即 Element | Text)。元素节点有type和children属性，文本节点有text属性。
  const [slateContent, setSlateContent] = useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: 'A line of text in a paragraph.' }],
    },
  ])

  const cleanupSlate = () => {
    if (editor.children.length > 0) {
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
    }
  }

  const onChange = (value: Descendant[]) => {
    setSlateContent(value)
  }

  useEffect(() => {
    if (mdSourceContent) {
      const slateNodes = markdownSourceToSlateNodes(mdSourceContent)
      // Using Transforms to clean up the slate content first, then insert the new content. Because setSlateContent is not working for slate.
      cleanupSlate();
      Transforms.insertNodes(editor, slateNodes, { at: [0] })
    }
  }, [mdSourceContent])

  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] mb-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <Slate editor={editor} initialValue={slateContent} onChange={onChange}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              style={{ border: 'none', boxShadow: 'none', outline: 'none' }} />
          </Slate>
        </div>
      </div>
    </div>
  )
}

export default ContentEditor