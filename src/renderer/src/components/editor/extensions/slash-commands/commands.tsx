// Command definitions for slash commands
// This file contains all available commands that can be triggered via "/" in the editor

import React from 'react'
import {
  CheckSquare,
  Code,
  Quote,
  Minus,
  Image,
  Link2,
  Table,
  Type,
  FileText
} from 'lucide-react'
import { useFileSystemStore } from '@renderer/stores/fileSystemStore'
import { getAllMarkdownFiles } from '@renderer/utils/fileOperations'

export interface Command {
  title: string
  icon: React.ReactNode
  command: ({ editor, range }: { editor: any; range: any }) => void
}

// Function to show file selector and insert page link
const handleInsertPageLink = ({ editor, range }: { editor: any; range: any }) => {
  const { fileTree } = useFileSystemStore.getState()
  const markdownFiles = getAllMarkdownFiles(fileTree)

  // Delete the slash command text first to close the slash commands menu
  editor.chain().focus().deleteRange(range).run()

  if (markdownFiles.length === 0) {
    // No markdown files found, insert a placeholder
    editor.chain()
      .focus()
      .insertContent('[[No pages found]]')
      .run()
    return
  }

  // Get the showSelector function from editor storage
  const showSelector = editor.storage.pageLink?.showSelector
  if (!showSelector) {
    console.error('showSelector function not found in editor storage')
    return
  }

  // Get cursor position to show selector (after deleting the slash command)
  const { view } = editor
  const currentPos = editor.state.selection.from
  const start = view.coordsAtPos(currentPos)

  // Show the page link selector using the hook function
  showSelector(editor, { x: start.left, y: start.bottom }, markdownFiles)
}

// List of all available slash commands
// Each command has a title, icon, and a function that executes when selected
export const commandsList: Command[] = [
  {
    title: 'Text',
    icon: <Type className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Link',
    icon: <Link2 className="w-4 h-4" />,
    command: ({ editor, range }) => {
      // Delete the slash command text and insert link in one transaction
      const linkText = 'link'
      const linkUrl = 'https://example.com'
      editor.chain()
        .focus()
        .deleteRange(range)
        .insertContent(linkText + ' ')  // insert link text followed by a space
        .setTextSelection({ from: range.from, to: range.from + linkText.length })
        .setLink({ href: linkUrl })
        .run()

      // The existing LinkBubbleMenu will automatically show up because we have an active link
    },
  },
  {
    title: 'Page Link',
    icon: <FileText className="w-4 h-4" />,
    command: handleInsertPageLink,
  },
  {
    title: 'Task List',
    icon: <CheckSquare className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Code Block',
    icon: <Code className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run()
    },
  },
  {
    title: 'Quote',
    icon: <Quote className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Divider',
    icon: <Minus className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Table',
    icon: <Table className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
]