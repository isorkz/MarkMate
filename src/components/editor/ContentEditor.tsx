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

// Slate wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
// Slate编辑器的节点可以是元素节点或文本节点，每种节点都有自己的属性。CustomTypes接口允许你为这些节点添加自定义的类型和属性。
type CustomElement = {
  type: 'paragraph',
  children: Descendant[],
}

type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const parseMarkdownToSlate = (mdContent: string) => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  const mdast = parser.parse(mdContent)
  return mdastToSlate(mdast.children)
}

// markdown AST to Slate AST.
// For markdown AST, it's a tree.
// For Slate, it's an array of nodes.
const mdastToSlate = (mdastNodes: any[]) => {
  if (!Array.isArray(mdastNodes)) {
    throw new TypeError(`Expected an array, but received ${typeof mdastNodes}`);
  }

  let slateNodes: Descendant[] = []
  for (let node of mdastNodes) {
    console.log("node:", node)
    switch (node.type) {
      case 'text':
        slateNodes.push({
          text: node.value,
        })
        break;
      default:
        slateNodes.push({
          type: 'paragraph',
          children: mdastToSlate(node.children),
        })
    }
  }

  return slateNodes
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
      const res = parseMarkdownToSlate(mdSourceContent)
      // Using Transforms to clean up the slate content first, then insert the new content.
      // Because setSlateContent is not working for slate.
      cleanupSlate();
      Transforms.insertNodes(editor, res, { at: [0] })
    }
  }, [mdSourceContent])

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <Slate editor={editor} initialValue={slateContent} onChange={value => { setSlateContent(value) }}>
            <Editable />
          </Slate>
          {/* <CodeMirror value={content} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={onChange} /> */}
          {/* <StyledMarkdown>{content}</StyledMarkdown> */}
        </div>
      </div>
    </div>
  )
}

export default ContentEditor