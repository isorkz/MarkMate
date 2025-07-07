import React, { useEffect } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from 'tiptap-markdown'
import toast from 'react-hot-toast'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import CodeBlock from './CodeBlock'
import { ImageElementUtils } from './ImageElementUtils'

// load all languages with "all" or common languages with "common"
import { common, createLowlight } from 'lowlight'

// Create lowlight instance
const lowlight = createLowlight(common)

interface RichEditorProps {
  tab: Tab
}

const RichEditor: React.FC<RichEditorProps> = ({ tab }) => {
  const { updateTabContent } = useEditorStore()
  const { settings } = useSettingsStore()
  const { currentWorkspace } = useWorkspaceStore()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        codeBlock: false // Disable default code block to use CodeBlockLowlight instead
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlock)
        },
      }).configure({ lowlight }),
      Markdown.configure({
        html: true,                  // Allow HTML input/output
        tightLists: true,            // No <p> inside <li> in markdown output
        tightListClass: 'tight',     // Add class to <ul> allowing you to remove <p> margins when tight
        bulletListMarker: '*',       // <li> prefix in markdown output
        linkify: false,              // Create links from "https://..." text
        breaks: false,               // New lines (\n) in markdown input are converted to <br>
        transformPastedText: false,  // Allow to paste markdown text in the editor
        transformCopiedText: false,  // Copied text is transformed to markdown
      }),
      Link.configure({
        openOnClick: false
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: tab?.content || '',
    onUpdate: ({ editor }) => {
      try {
        const markdown = editor.storage.markdown.getMarkdown()
        updateTabContent(tab.id, markdown)
      } catch (err) {
        console.warn('Markdown conversion failed:', err)
        toast.error('Markdown conversion failed')
      }
    },
    editorProps: {
      attributes: {
        class: 'RichEditorView max-w-none focus:outline-none h-full overflow-auto',
        style: `font-size: 16px; padding: 60px; line-height: 1.6;`
      },
      handlePaste: (view, event) => {
        // Handle image paste to save as local file instead of data URL
        if (currentWorkspace && tab && editor) {
          // Check if clipboard contains images
          if (event.clipboardData) {
            const items = Array.from(event.clipboardData.items)
            const imageItem = items.find(item => item.type.startsWith('image/'))

            if (imageItem) {
              // Prevent default paste and handle async operation
              event.preventDefault()
              ImageElementUtils.handleImagePaste(
                editor,
                imageItem,
                currentWorkspace.path,
                tab.filePath
              )
              return true // Indicate we handled the paste
            }
          }
        }
        return false // Allow default paste behavior
      }
    }
  })

  // Update Rich editor content when user is typing on Source editor, or switching tabs
  useEffect(() => {
    // '!editor.isFocused' ensures when user is typing on Source editor, or switching tabs
    // If user is typing in the Rich editor, only use onUpdate() to update content
    if (editor && tab && !editor.isFocused) {
      try {
        const markdown = editor.storage.markdown.getMarkdown()
        if (markdown !== tab.content) {
          // false (default): Silent update - doesn't trigger onUpdate callback
          editor.commands.setContent(tab.content, false)
        }
      } catch (error) {
        // Fallback: always update if we can't get markdown
        console.warn('Could not get markdown, updating content:', error)
        editor.commands.setContent(tab.content, false)
      }
    }
  }, [tab?.content, editor])

  // Resolve image paths when content is loaded or workspace/tab changes
  useEffect(() => {
    if (editor && currentWorkspace && tab) {
      // Add a delay to ensure content is fully loaded
      const timeoutId = setTimeout(() => {
        ImageElementUtils.resolveAllImageElementsInDom(editor, currentWorkspace.path, tab.filePath)
      }, 200)

      return () => clearTimeout(timeoutId)
    }
  }, [editor, currentWorkspace, tab, tab?.content])

  if (!tab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">No file selected</div>
    )
  }

  return (
    <div
      className={`h-full flex flex-col ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <EditorContent
            editor={editor}
            className={`min-h-full ${settings.theme === 'dark' ? 'prose-invert' : ''}`}
          />
        </div>
      </div>
    </div>
  )
}

export default RichEditor
