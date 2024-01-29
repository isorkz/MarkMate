import { BaseEditor, Descendant, Element as SlateElement, Range } from 'slate'
import { ReactEditor } from 'slate-react'

// Define custom types and properties for Slate nodes.
// Slate wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
// Descendant类型在Slate中是一个广义的节点类型，它可以是一个元素节点，也可以是一个文本节点(即 Element | Text)。元素节点有type和children属性，文本节点有text属性。
type Align = 'left' | 'center' | 'right'
export type ParagraphElement = { type: 'paragraph', children: Descendant[], checked?: boolean }
export type HeadElement = { type: 'head', children: Descendant[], level?: number }
export type ListElement = { type: 'list', children: Descendant[], order?: boolean, start?: number }
export type ListItemElement = { type: 'list-item', children: Descendant[], checked?: boolean }
export type CodeElement = { type: 'code', children: Descendant[], language?: string }
export type CodeLineElement = { type: 'code-line', children: Descendant[], num?: number }  // Represent each line in CodeElement
export type ImageElement = { type: 'image', url: string, alt: string, children: Descendant[] }
export type HrElement = { type: 'hr', children: Descendant[] }   // Element must have children property, even though HrElement doesn't need it. Otherwise it will throw exceptions for Transforms.insertNodes.
export type BlockQuoteElement = { type: 'blockquote', children: Descendant[] }
export type TableElement = { type: 'table', children: Descendant[], align: Align[] }
export type TableRowElement = { type: 'table-row', children: Descendant[] }
export type TableCellElement = { type: 'table-cell', children: Descendant[], isFirstRow?: boolean, align?: Align }
export type FootnoteReferenceElement = { type: 'footnoteReference', identifier?: string, label?: string, children: Descendant[] }
export type FootnoteDefinitionElement = { type: 'footnoteDefinition', identifier?: string, label?: string, children: Descendant[] }
export type HtmlElement = { type: 'html', value: string, children: Descendant[] }

export type CustomText = {
  text: string,
  isInlineCode?: boolean,
  url?: string,
  bold?: boolean,
  emphasis?: boolean,
  delete?: boolean,
  html?: boolean,
  // color is set by code block highlighter.
  color?: string,
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & { nodeToDecorations?: Map<SlateElement, Range[]> }
    Element: ParagraphElement | HeadElement | ListElement | ListItemElement | CodeElement | CodeLineElement | ImageElement
    | BlockQuoteElement | TableElement | TableRowElement | TableCellElement | HrElement | FootnoteReferenceElement | FootnoteDefinitionElement | HtmlElement
    Text: CustomText
  }
}