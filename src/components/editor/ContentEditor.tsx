import { useState, useCallback, useMemo, Dispatch, SetStateAction, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import StyledMarkdown from './StyledMarkdown';
import { BaseEditor, Descendant, Editor, Transforms, createEditor, Element as SlateElement, Text, } from 'slate'
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

const parseMarkdownToSlate = (mdContent: string) => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  const mdast = parser.parse(mdContent)
  return mdastToSlate(mdast.children)
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
const mdastToSlate = (mdastNodes: any[]) => {
  let slateNodes: Descendant[] = []
  for (let node of mdastNodes) {
    switch (node.type) {
      case 'paragraph':
        slateNodes.push({
          type: 'paragraph',
          children: mdastToSlate(node.children),
        })
        break;
      case 'heading':
        slateNodes.push({
          type: 'head',
          level: node.depth,
          children: mdastToSlate(node.children),
        })
        break;
      case 'list':
        slateNodes.push({
          type: 'list',
          order: node.ordered,
          children: mdastToSlate(node.children),
        })
        break;
      case 'listItem':
        slateNodes.push({
          type: 'list-item',
          checked: node.checked,
          children: mdastToSlate(node.children),
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
          children: mdastToSlate(node.children),
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
                  children: mdastToSlate(cell.children),
                }
              }),
            }
          }),
        });
        break;
      case 'tableRow':
        slateNodes.push({
          type: 'table-row',
          children: mdastToSlate(node.children),
        })
        break;
      case 'tableCell':
        slateNodes.push({
          type: 'table-cell',
          children: mdastToSlate(node.children),
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

const ContentEditor = ({
  mdSourceContent,
  setMdSourceContent,
}: ContentEditorProps) => {
  // Rich text editor: Slate, wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
  const editor = useMemo(() => withReact(createEditor()), [])
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

  useEffect(() => {
    if (mdSourceContent) {
      const slateNodes = parseMarkdownToSlate(mdSourceContent)
      // Using Transforms to clean up the slate content first, then insert the new content.
      // Because setSlateContent is not working for slate.
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
          <Slate editor={editor} initialValue={slateContent} onChange={value => { setSlateContent(value) }} >
            <Editable renderElement={renderElement} renderLeaf={renderLeaf} style={{ border: 'none', boxShadow: 'none', outline: 'none' }} />
          </Slate>
          {/* <CodeMirror value={content} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={onChange} /> */}
          {/* <StyledMarkdown>{mdSourceContent}</StyledMarkdown> */}
        </div>
      </div>
    </div>
  )
}

export default ContentEditor