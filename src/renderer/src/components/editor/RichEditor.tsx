import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import { Markdown } from '@tiptap/markdown'
import Typography from '@tiptap/extension-typography'
import Strike from '@tiptap/extension-strike'
import Highlight from '@tiptap/extension-highlight'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Code from '@tiptap/extension-code'
import toast from 'react-hot-toast'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useRichEditorSearch } from '../../hooks/useRichEditorSearch'
import CodeBlock from './codeblock/CodeBlock'
import { CodeBlockUtils } from './codeblock/CodeBlockUtils'
import { ImageElementUtils } from './ImageElementUtils'
import RichEditorSearch from '../search/RichEditorSearch'
import LinkBubbleMenu from './bubble-menu/LinkBubbleMenu'
import SelectionBubbleMenu from './bubble-menu/SelectionBubbleMenu'
// https://github.com/sereneinserenade/tiptap-search-and-replace
import SearchAndReplace from './extensions/search/SearchAndReplace'
// Slash commands extension
import { SlashCommands } from './extensions/slash-commands/SlashCommands'
import { suggestion } from './extensions/slash-commands/suggestion'
import { PageLink } from './extensions/page-link/PageLink'
import { PageLinkParser } from './extensions/page-link/PageLinkParser'
import PageLinkSelector from './extensions/page-link/ui/PageLinkSelector'
import { usePageLinkSelector } from './extensions/page-link/hooks/usePageLinkSelector'
// load all languages with "all" or common languages with "common"
import { common, createLowlight } from 'lowlight'

// Create lowlight instance
const lowlight = createLowlight(common)

interface RichEditorProps {
  tab: Tab
}

const RichEditor: React.FC<RichEditorProps> = ({ tab }) => {
  const { updateTabContent, readOnlyMode, showSourceEditor } = useEditorStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { appearanceSettings } = useSettingsStore()

  const lastMarkdownRef = useRef(tab?.content ?? '')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        codeBlock: false, // Disable default code block to use CodeBlockLowlight instead
        strike: false, // Disable default strike to use custom one with Mod-d shortcut
        link: false, // Disable default Link, we configure our own below
        underline: false, // Disable default Underline, we configure our own below
        bold: false, // Disable default, re-added below with keepOnSplit: false
        italic: false,
        code: false,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlock)
        },
        addKeyboardShortcuts() {
          return {
            // Custom Mod-a behavior for code blocks
            // Select all text within the code block instead of the whole document
            'Mod-a': ({ editor }) => {
              // Check if cursor is in a code block
              const { $from } = editor.state.selection
              const node = $from.node()

              if (node.type.name === 'codeBlock') {
                // Get the code block content and select all
                const codeBlockPos = $from.before()
                const codeBlockNode = editor.state.doc.nodeAt(codeBlockPos)

                if (codeBlockNode) {
                  // Select all content within the code block
                  editor.commands.setTextSelection({
                    from: codeBlockPos + 1,
                    to: codeBlockPos + codeBlockNode.nodeSize - 1
                  })
                  return true
                }
              }
              return false
            },
            // Tab - indent in code blocks
            'Tab': ({ editor }) => CodeBlockUtils.indentTab(editor),
            // Shift+Tab - unindent in code blocks
            'Shift-Tab': ({ editor }) => CodeBlockUtils.unindentTab(editor)
          }
        }
      }).configure({ lowlight }),
      Markdown,
      Bold.extend({ keepOnSplit: false }),
      Italic.extend({ keepOnSplit: false }),
      Code.extend({ keepOnSplit: false }),
      Link.configure({
        openOnClick: false
      }),
      Underline.extend({ keepOnSplit: false }),
      Strike.extend({
        keepOnSplit: false,
        addKeyboardShortcuts() {
          return {
            'Mod-d': () => this.editor.commands.toggleStrike(),
          }
        }
      }),
      Highlight.extend({
        keepOnSplit: false,
        addKeyboardShortcuts() {
          return {
            'Mod-h': () => this.editor.commands.toggleHighlight(),
          }
        },
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
      SearchAndReplace.configure({
        disableRegex: false,
      }),
      SlashCommands.configure({
        suggestion,
      }),
      PageLink, // handle the page links in the rich editor
      PageLinkParser, // parsing [[page link]] in md content to PageLink nodes when loading file
      Typography,
    ],
    content: tab?.content || '',
    contentType: 'markdown',
    onUpdate: ({ editor, transaction }) => {
      try {
        if (!tab || !transaction?.docChanged) {
          return
        }

        const markdown = editor.getMarkdown()

        if (markdown !== lastMarkdownRef.current) {
          lastMarkdownRef.current = markdown
          updateTabContent(tab.id, markdown)
        }
      } catch (err) {
        console.error('Markdown conversion failed:', err)
        toast.error('Markdown conversion failed')
      }
    },
    editorProps: {
      attributes: {
        class: `RichEditorView max-w-none focus:outline-none h-full overflow-auto ${readOnlyMode ? 'select-text' : ''}`,
        style: `font-size: 16px; padding: 60px; line-height: 1.6; ${readOnlyMode ? 'user-select: text; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;' : ''}`
      },
      // Allow selection and copy even in read-only mode
      handleKeyDown: (_, event) => {
        if (readOnlyMode) {
          // Allow Ctrl+A (Select All) and Ctrl+C (Copy) in read-only mode
          if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'c')) {
            return false // Allow default behavior
          }
        }
        return false
      },
      handlePaste: (_, event) => {
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

  // Update Rich editor content when user is typing on Source editor or when content changes externally 
  useEffect(() => {
    // '!editor.isFocused' ensures when user is only typing on Source editor
    // If user is typing in the Rich editor, only use onUpdate() to update content
    if (tab && editor && !editor.isFocused) {
      try {
        const markdown = editor.getMarkdown()
        if (markdown !== tab.content) {
          // false (default): Silent update - doesn't trigger onUpdate callback
          editor.commands.setContent(tab.content, { emitUpdate: false, contentType: 'markdown' })
        }
      } catch (error) {
        console.error('Markdown conversion failed:', error)
        toast.error('Markdown conversion failed')
      }
    }
  }, [tab?.content, editor?.isFocused, showSourceEditor])

  // Update editor editable state when read-only mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnlyMode)
    }
  }, [editor, readOnlyMode])

  useEffect(() => {
    if (tab) {
      lastMarkdownRef.current = tab.content ?? ''
    }
  }, [tab?.id, tab?.content])

  // Resolve image paths when content is loaded or workspace/tab changes
  useEffect(() => {
    if (editor && currentWorkspace && tab) {
      // Add a delay to ensure content is fully loaded
      const timeoutId = setTimeout(() => {
        ImageElementUtils.resolveAllImageElementsInDom(editor, currentWorkspace.path, tab.filePath)
      }, 200)

      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [editor, currentWorkspace, tab, tab?.content])

  // Initialize the page link selector state and functions
  const {
    showSelector,
    isOpen,
    files,
    position,
    onSelect,
    onClose
  } = usePageLinkSelector()

  // Store the showSelector function for slash commands
  useEffect(() => {
    if (editor) {
      editor.storage.pageLink = {
        showSelector: showSelector
      }
    }
  }, [editor, showSelector])

  // Search functionality
  const {
    showSearch,
    searchTerm,
    currentMatchIndex,
    totalMatches,
    searchInputRef,
    nextMatch,
    prevMatch,
    closeSearch,
    setSearchTerm
  } = useRichEditorSearch(editor)

  if (!tab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">No file selected</div>
    )
  }

  return (
    <div
      className={`h-full flex flex-col relative ${appearanceSettings.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
    >
      {/* Search Component */}
      {showSearch && (
        <RichEditorSearch
          searchTerm={searchTerm}
          currentMatchIndex={currentMatchIndex}
          totalMatches={totalMatches}
          onSearchChange={(term) => {
            setSearchTerm(term)
          }}
          onNextMatch={nextMatch}
          onPrevMatch={prevMatch}
          onClose={closeSearch}
          searchInputRef={searchInputRef}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <EditorContent
            editor={editor}
            className={`min-h-full ${appearanceSettings.theme === 'dark' ? 'prose-invert' : ''}`}
          />

          {editor && (
            <>
              <SelectionBubbleMenu editor={editor} />
              <LinkBubbleMenu editor={editor} />
            </>
          )}

          {isOpen && (
            <PageLinkSelector
              files={files}
              onSelect={onSelect}
              onClose={onClose}
              position={position}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default RichEditor
