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
  Type
} from 'lucide-react'

export interface Command {
  title: string
  icon: React.ReactNode
  command: ({ editor, range }: { editor: any; range: any }) => void
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