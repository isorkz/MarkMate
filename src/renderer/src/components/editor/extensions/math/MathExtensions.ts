import { InputRule } from '@tiptap/core'
import type { MarkdownToken } from '@tiptap/core'
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics'

type MathDelimiter = 'backslash' | 'dollar'

const firstDelimiterIndex = (source: string, delimiters: string[]): number => {
  const indexes = delimiters
    .map((delimiter) => source.indexOf(delimiter))
    .filter((index) => index >= 0)

  return indexes.length > 0 ? Math.min(...indexes) : -1
}

const createMathToken = (
  type: 'blockMath' | 'inlineMath',
  match: RegExpMatchArray,
  delimiter: MathDelimiter
): MarkdownToken => ({
  type,
  raw: match[0],
  latex: match[1].trim(),
  delimiter
})

export const BlockMathWithLatexDelimiters = BlockMath.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      delimiter: {
        default: 'dollar',
        rendered: false
      }
    }
  },

  parseMarkdown: (token) => ({
    type: 'blockMath',
    attrs: {
      latex: token.latex,
      delimiter: token.delimiter
    }
  }),

  renderMarkdown: (node) => {
    const latex = node.attrs?.latex || ''

    if (node.attrs?.delimiter === 'backslash') {
      return `\\[\n${latex}\n\\]`
    }

    return `$$\n${latex}\n$$`
  },

  markdownTokenizer: {
    name: 'blockMath',
    level: 'block',
    start: (source) => firstDelimiterIndex(source, ['$$', '\\[']),
    tokenize: (source) => {
      const backslashMatch = source.match(/^\\\[([\s\S]+?)\\\]/)
      if (backslashMatch) {
        return createMathToken('blockMath', backslashMatch, 'backslash')
      }

      const dollarMatch = source.match(/^\$\$([^$]+?)\$\$/)
      if (dollarMatch) {
        return createMathToken('blockMath', dollarMatch, 'dollar')
      }

      return undefined
    }
  },

  addInputRules() {
    return [
      ...(this.parent?.() || []),
      new InputRule({
        find: /^\\\[([\s\S]+?)\\\]$/,
        handler: ({ state, range, match }) => {
          const latex = match[1].trim()
          if (!latex) {
            return
          }

          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex, delimiter: 'backslash' })
          )
        }
      })
    ]
  }
})

export const InlineMathWithLatexDelimiters = InlineMath.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      delimiter: {
        default: 'dollar',
        rendered: false
      }
    }
  },

  parseMarkdown: (token) => ({
    type: 'inlineMath',
    attrs: {
      latex: token.latex,
      delimiter: token.delimiter
    }
  }),

  renderMarkdown: (node) => {
    const latex = node.attrs?.latex || ''

    if (node.attrs?.delimiter === 'backslash') {
      return `\\(${latex}\\)`
    }

    return `$${latex}$`
  },

  markdownTokenizer: {
    name: 'inlineMath',
    level: 'inline',
    start: (source) => firstDelimiterIndex(source, ['$', '\\(']),
    tokenize: (source) => {
      const backslashMatch = source.match(/^\\\((.+?)\\\)/)
      if (backslashMatch) {
        return createMathToken('inlineMath', backslashMatch, 'backslash')
      }

      const dollarMatch = source.match(/^\$([^$\n]+)\$(?!\$)/)
      if (dollarMatch) {
        return createMathToken('inlineMath', dollarMatch, 'dollar')
      }

      return undefined
    }
  },

  addInputRules() {
    return [
      ...(this.parent?.() || []),
      new InputRule({
        find: /\\\((.+?)\\\)$/,
        handler: ({ state, range, match }) => {
          const latex = match[1].trim()
          if (!latex) {
            return
          }

          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex, delimiter: 'backslash' })
          )
        }
      })
    ]
  }
})
