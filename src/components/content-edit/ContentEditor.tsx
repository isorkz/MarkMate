import { useState, useCallback, useMemo, Dispatch, SetStateAction } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import StyledMarkdown from './StyledMarkdown';
import { BaseEditor, Descendant, Editor, Transforms, createEditor, Element as SlateElement, Text, } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, ReactEditor, withReact } from 'slate-react'

interface ContentEditorProps {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
}

type CustomElement = {
  type: 'paragraph',
  children: CustomText[],
}

type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const ContentEditor = ({
  content,
  setContent,
}: ContentEditorProps) => {
  // Rich text editor: Slate, wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
  const editor = useMemo(() => withReact(createEditor()), [])

  const initialValue: CustomElement[] = [
    {
      type: 'paragraph',
      children: [
        { text: 'A line of text in a paragraph.' }
      ],
    }
  ]

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <Slate editor={editor} initialValue={initialValue}>
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