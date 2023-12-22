import { useState, useCallback, useMemo, Dispatch, SetStateAction, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import StyledMarkdown from './StyledMarkdown';
import { BaseEditor, Descendant, Editor, Transforms, createEditor, Element as SlateElement, Text, } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, ReactEditor, withReact } from 'slate-react'
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
type LinkElement = { type: 'link', url: string, children: Descendant[] }
type HrElement = { type: 'hr', children: Descendant[] }   // Element must have children property, even though HrElement doesn't need it. Otherwise it will throw exceptions for Transforms.insertNodes.
type StrongElement = { type: 'strong', children: Descendant[] }
type EmphasisElement = { type: 'emphasis', children: Descendant[] }
type DeleteElement = { type: 'delete', children: Descendant[] }
type BlockQuoteElement = { type: 'blockquote', children: Descendant[] }
type TableElement = { type: 'table', children: Descendant[] }
type TableRowElement = { type: 'table-row', children: Descendant[] }
type TableCellElement = { type: 'table-cell', children: Descendant[] }
type FootnoteReferenceElement = { type: 'footnoteReference', identifier?: string, label?: string, children: Descendant[] }
type FootnoteDefinitionElement = { type: 'footnoteDefinition', identifier?: string, label?: string, children: Descendant[] }

type CustomText = {
  text: string,
  isInlineCode?: boolean,
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: ParagraphElement | HeadElement | ListElement | ListItemElement | CodeElement | CodeInlineElement | ImageElement | LinkElement | StrongElement | EmphasisElement | DeleteElement
    | BlockQuoteElement | TableElement | TableRowElement | TableCellElement | HrElement | FootnoteReferenceElement | FootnoteDefinitionElement
    Text: CustomText
  }
}

const parseMarkdownToSlate = (mdContent: string) => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  const mdast = parser.parse(mdContent)
  return mdastToSlate(mdast.children)
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
      case 'text':
        slateNodes.push({
          text: node.value,
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
      case 'inlineCode':
        slateNodes.push({
          text: node.value,
          isInlineCode: true,
        })
        break;
      case 'image':
        slateNodes.push({
          type: 'image',
          url: decodeURIComponent(node.url),
          children: [{ text: '' }],
        })
        break;
      case 'link':
        slateNodes.push({
          type: 'link',
          url: decodeURIComponent(node.url),
          children: [{ text: '' }],
        })
        break;
      case 'delete':
        slateNodes.push({
          type: 'delete',
          children: mdastToSlate(node.children),
        })
        break;
      case 'strong':
        slateNodes.push({
          type: 'strong',
          children: mdastToSlate(node.children),
        })
        break;
      case 'emphasis':
        slateNodes.push({
          type: 'emphasis',
          children: mdastToSlate(node.children),
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
          children: mdastToSlate(node.children),
        })
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
      default:
        throw new TypeError(`Unknown node type: ${node}`);
    }
  }

  return slateNodes
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'image':
      return <img src={element.url}>{children}</img>
    default:
      return <p {...attributes}>{children}</p>
  }
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
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    });
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

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <Slate editor={editor} initialValue={slateContent} onChange={value => { setSlateContent(value) }}>
            <Editable renderElement={renderElement} />
          </Slate>
          {/* <CodeMirror value={content} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={onChange} /> */}
          {/* <StyledMarkdown>{mdSourceContent}</StyledMarkdown> */}
        </div>
      </div>
    </div>
  )
}

export default ContentEditor