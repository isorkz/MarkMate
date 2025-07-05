import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import CodeBlock from '@tiptap/extension-code-block'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import { createHighlighter } from 'shiki'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface RichEditorProps {
  tab: Tab
}

const RichEditor: React.FC<RichEditorProps> = ({ tab }) => {
  const { updateTabContent } = useEditorStore()
  const { settings } = useSettingsStore()
  const [highlighter, setHighlighter] = useState<any>(null)

  // Initialize Shiki highlighter
  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const hl = await createHighlighter({
          themes: ['github-light', 'github-dark'],
          langs: ['javascript', 'typescript', 'python', 'java', 'cpp', 'markdown', 'json', 'html', 'css']
        })
        setHighlighter(hl)
      } catch (error) {
        console.error('Failed to initialize highlighter:', error)
      }
    }

    initHighlighter()
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block
      }),
      Typography,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: tab?.content || '',
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      updateTabContent(tab.id, content)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none p-6',
        style: `font-size: ${settings.fontSize}px; font-family: ${settings.fontFamily}`,
      },
    },
  })

  // Update editor content when active tab changes
  useEffect(() => {
    if (editor && tab) {
      const currentContent = editor.getHTML()
      if (currentContent !== tab.content) {
        editor.commands.setContent(tab.content, false)
      }
    }
  }, [editor, tab?.content, tab?.id])

  // Apply syntax highlighting to code blocks
  useEffect(() => {
    if (highlighter && editor) {
      const codeBlocks = document.querySelectorAll('.code-block code')

      codeBlocks.forEach((block) => {
        const parent = block.parentElement
        const language = parent?.getAttribute('data-language') || 'text'
        const code = block.textContent || ''

        try {
          const html = highlighter.codeToHtml(code, {
            lang: language,
            theme: settings.theme === 'dark' ? 'github-dark' : 'github-light'
          })

          // Extract just the highlighted code content
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = html
          const highlightedCode = tempDiv.querySelector('code')?.innerHTML || code

          block.innerHTML = highlightedCode
        } catch (error) {
          // Fallback to plain text if highlighting fails
          block.textContent = code
        }
      })
    }
  }, [highlighter, editor, tab?.content, settings.theme])

  if (!tab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No file selected
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default RichEditor