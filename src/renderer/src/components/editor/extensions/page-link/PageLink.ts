import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { InputRule } from '@tiptap/core'
import PageLinkNode from './ui/PageLinkNode'

export interface PageLinkOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageLink: {
      setPageLink: (attributes: { pageName: string; relativePath: string }) => ReturnType
    }
  }
}

export const PageLink = Node.create<PageLinkOptions>({
  name: 'pageLink',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      pageName: { default: null },
      relativePath: { default: null },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'page-link' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `[[${node.attrs.relativePath}]]`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageLinkNode)
  },

  renderText({ node }) {
    return `[[${node.attrs.relativePath}]]`
  },

  addCommands() {
    return {
      setPageLink:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },

  addStorage() {
    return {
      // Serialize the page link node to Markdown content
      markdown: {
        serialize: (state: any, node: any) => {
          state.write(`[[${node.attrs.relativePath}]]`)
        }
      }
    }
  },

  // Handle when user types [[page link]], convert it to a page link node
  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ commands, range, match }) => {
          const [, linkText] = match
          const relativePath = linkText
          const pageName = linkText.split('/').pop()?.replace(/\.[^.]*$/, '') || linkText
          
          commands.insertContentAt(range, this.type.create({ pageName, relativePath }))
        },
      }),
    ]
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="page-link"]',
      },
    ]
  },

  addPasteRules() {
    return [
      {
        find: /\[\[([^\]]+)\]\]/g,
        handler: ({ commands, range, match }) => {
          const [, linkText] = match
          const relativePath = linkText
          const pageName = linkText.split('/').pop()?.replace(/\.[^.]*$/, '') || linkText
          
          commands.insertContentAt(range, this.type.create({ pageName, relativePath }))
        },
      },
    ]
  },
})