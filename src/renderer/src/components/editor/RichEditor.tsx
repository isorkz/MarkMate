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
import Underline from '@tiptap/extension-underline'
import { Markdown } from 'tiptap-markdown'
import Typography from '@tiptap/extension-typography'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import Strike from '@tiptap/extension-strike'
import Highlight from '@tiptap/extension-highlight'
import toast from 'react-hot-toast'
import { useEditorStore, Tab } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useRichEditorSearch } from '../../hooks/useRichEditorSearch'
import CodeBlock from './CodeBlock'
import { ImageElementUtils } from './ImageElementUtils'
import RichEditorSearch from '../search/RichEditorSearch'
import LinkBubbleMenu from './bubble-menu/LinkBubbleMenu'
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        codeBlock: false, // Disable default code block to use CodeBlockLowlight instead
        strike: false // Disable default strike to use custom one with Mod-d shortcut
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlock)
        },
      }).configure({ lowlight }),
      Markdown.configure({
        html: true,                  // Allow HTML input/output (see tests in tiptap-markdown source code for examples)
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
      Underline,
      Strike.extend({
        addKeyboardShortcuts() {
          return {
            'Mod-d': () => this.editor.commands.toggleStrike(),
          }
        }
      }),
      Highlight.extend({
        addKeyboardShortcuts() {
          return {
            'Mod-h': () => this.editor.commands.toggleHighlight(),
          }
        }
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
      BubbleMenu,
    ],
    content: tab?.content || '',
    onUpdate: ({ editor, transaction }) => {
      try {
        const hasPageLinkInsertion = transaction?.steps.some((step: any) =>
          step.slice?.content?.content?.some((node: any) => node.type?.name === 'pageLink')
        )

        // Only trigger content update if user is actively editing (editor is focused) or inserting page links
        // This prevents marking tabs as dirty when programmatically setting content 
        if (!editor.isFocused && !hasPageLinkInsertion) return

        const markdown = editor.storage.markdown.getMarkdown()
        updateTabContent(tab.id, markdown)
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

  // Update Rich editor content when user is typing on Source editor
  useEffect(() => {
    // '!editor.isFocused' ensures when user is only typing on Source editor
    // If user is typing in the Rich editor, only use onUpdate() to update content
    if (showSourceEditor && tab && editor && !editor.isFocused) {
      try {
        const markdown = editor.storage.markdown.getMarkdown()
        if (markdown !== tab.content) {
          // false (default): Silent update - doesn't trigger onUpdate callback
          editor.commands.setContent(tab.content, false)
        }
      } catch (error) {
        // Fallback: always update if we can't get markdown
        console.error('Could not get markdown, updating content:', error)
        editor.commands.setContent(tab.content, false)
      }
    }
  }, [tab?.content, editor?.isFocused, showSourceEditor])

  // Update editor editable state when read-only mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnlyMode)
    }
  }, [editor, readOnlyMode])

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

          {editor && <LinkBubbleMenu editor={editor} />}

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
