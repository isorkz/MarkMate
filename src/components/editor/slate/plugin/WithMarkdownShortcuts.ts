import { Editor, Transforms, Element as SlateElement, Range } from 'slate'
import { assert } from '../../../../utils/common';
import { insertBreakForHead, insertBreakForListItem } from './insertBreak';
import { deleteBackwardForHead, deleteBackwardForListItem, deleteBackwardForParagraph } from './deleteBackward';

const SHORTCUTS = {
  '*': { type: 'list-item' },
  '-': { type: 'list-item' },
  '+': { type: 'list-item' },
  '>': { type: 'blockquote' },
  '#': { type: 'head', level: 1 },
  '##': { type: 'head', level: 2 },
  '###': { type: 'head', level: 3 },
  '####': { type: 'head', level: 4 },
  '#####': { type: 'head', level: 5 },
  '######': { type: 'head', level: 6 },
}

// withMarkdownShortcuts: is a custom plugin to modify the editor's behavior. Example: https://github.com/ianstormtaylor/slate/blob/main/site/examples/markdown-shortcuts.tsx
export const withMarkdownShortcuts = (editor: Editor) => {
  // insertText is a built-in function of Editor to insert text.
  const { insertText, deleteBackward, insertBreak, deleteFragment } = editor;

  // Override the insertText method to handle our custom logic
  editor.insertText = (text) => {
    // In slate, 'selection' is a range, which is a tuple of two points: 'anchor' and 'focus'.
    // 'anchor' is the point where the user started the selection, and 'focus' is the point where the user ended the selection.
    // If the user has not selected anything, then 'anchor' and 'focus' will be the same, and the selection will be collapsed, or it's 'cursor'.
    // 'anchor' and 'focus' are both objects with 'path' and 'offset' properties.
    // - 'path' is an array of indexes into the document, describing a path of nodes to get from the root to the current node.
    // - 'offset' is the character offset at which the selection begins or ends in the current node.
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      // Get the ancestor block element of the current selection.
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const rangeText = Editor.string(editor, range)
      const beforeText = rangeText + text.slice(0, -1)
      const lineText = rangeText + text

      const [parentNode] = Editor.parent(editor, path)
      // console.log('[insertText] block: ', block)
      // console.log('[insertText] lineText: ', lineText)
      // console.log('[insertText] parentNode: ', parentNode)
      if (SlateElement.isElement(parentNode) && parentNode.type === 'code') {
        // If user is typeing in code block, just insert the text as usual.
        insertText(text)
        return
      }

      // Handle '---', '***', '==='
      if (['---', '***', '==='].includes(lineText)) {
        Editor.deleteBackward(editor, { unit: 'line' })
        Transforms.insertNodes(editor, { type: 'hr', children: [{ text: '' }] }, { at: path })
        return
      }
      // Handle code block '```'
      else if (lineText === '```') {
        Editor.deleteBackward(editor, { unit: 'line' })

        // Get the language of the previous code block
        const prevCodeBlockNode = Editor.previous(editor, { match: n => SlateElement.isElement(n) && n.type === 'code' })
        const language = prevCodeBlockNode && 'language' in prevCodeBlockNode[0] ? prevCodeBlockNode[0].language : undefined;
        // Set the language of the new code block to the same as the previous one
        Transforms.insertNodes(editor, { type: 'code', language: language, children: [{ type: 'code-line', children: [{ text: '' }] }] }, { at: path })

        // Set the cursor to the start of the code line
        Transforms.select(editor, Editor.start(editor, path))
        return
      }
      // Handle bold '**'
      else if (lineText.endsWith('**')) {
        let boldText = lineText.slice(0, -2)
        let index = boldText.lastIndexOf('**')
        if (index != -1) {
          boldText = boldText.slice(index + 2)
          for (let i = 0; i < boldText.length + 3; i++) {
            Editor.deleteBackward(editor, { unit: 'character' })
          }
          Transforms.insertNodes(editor, { text: boldText, bold: true })
          Transforms.insertNodes(editor, { text: ' ', isInlineCode: false })
          return
        }
      }
      // Handle emphasis '*'
      else if (lineText.endsWith('*')) {
        let boldText = lineText.slice(0, -1)
        let index = boldText.lastIndexOf('*')
        if (index != -1 && !boldText.endsWith('*')) { // filter out bold '**'
          boldText = boldText.slice(index + 1)
          for (let i = 0; i < boldText.length + 1; i++) {
            Editor.deleteBackward(editor, { unit: 'character' })
          }
          Transforms.insertNodes(editor, { text: boldText, emphasis: true })
          Transforms.insertNodes(editor, { text: ' ', isInlineCode: false })
          return
        }
      }
      // Handle delete '~~'
      else if (lineText.endsWith('~~')) {
        let boldText = lineText.slice(0, -2)
        let index = boldText.lastIndexOf('~~')
        if (index != -1) {
          boldText = boldText.slice(index + 2)
          for (let i = 0; i < boldText.length + 3; i++) {
            Editor.deleteBackward(editor, { unit: 'character' })
          }
          Transforms.insertNodes(editor, { text: boldText, delete: true })
          Transforms.insertNodes(editor, { text: ' ', isInlineCode: false })
          return
        }
      }
      // Handle inline code
      else if (text.endsWith('`')) {
        let index = beforeText.lastIndexOf('`')
        if (index != -1 && !beforeText.endsWith('`')) {  // filter out code block '```'
          const inlineCodeText = beforeText.slice(index + 1)
          // or using:
          // Transforms.delete(editor, {
          //   at: {
          //     anchor: { path: anchor.path, offset: anchor.offset - inlineCodeText.length - 1 },
          //     focus: anchor
          //   }
          // })
          for (let i = 0; i < inlineCodeText.length + 1; i++) {
            Editor.deleteBackward(editor, { unit: 'character' })
          }
          Transforms.insertNodes(editor, { text: inlineCodeText, isInlineCode: true })
          Transforms.insertNodes(editor, { text: ' ', isInlineCode: false })
          return
        }
      }
      // If the user is typing the markdown shortcuts at the beginning of a block, autoformat it.
      else if (text.endsWith(' ')) {
        const element = SHORTCUTS[beforeText]

        if (element) {
          Transforms.select(editor, range)

          if (!Range.isCollapsed(range)) {
            Transforms.delete(editor)
          }

          if (element.type === 'list-item') {
            Transforms.wrapNodes(editor, { type: 'list-item', children: [] }, { at: path })
            Transforms.wrapNodes(editor, { type: 'list', children: [] }, { at: path })
            // // If the above and below blocks are not list items, wrap the current block with a new list
            // const prevNode = Editor.previous(editor, { match: n => SlateElement.isElement(n) && n.type === 'list-item' })
            // const nextNode = Editor.next(editor, { match: n => SlateElement.isElement(n) && n.type === 'list-item' })
            // console.log('prevNode: ', prevNode)
            // console.log('nextNode: ', nextNode)
            // if (!prevNode && !nextNode) {
            //   Transforms.wrapNodes(editor, { type: 'list-item', children: [] }, { at: path })
            //   Transforms.wrapNodes(editor, { type: 'list', children: [] }, { at: path })
            // } else {
            //   // Transforms.insertNodes(editor, element)
            // }
          } else {
            // set the type of the current block to the new element type
            Transforms.setNodes<SlateElement>(editor, element, {
              match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
            })
          }

          return
        }
      }
    }

    // If user is not typing a markdown shortcut, just insert the text as usual.
    insertText(text)
  }

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection) {
      // Get the ancestor block element of the current selection.
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      // console.log('[insertBreak] block: ', block)

      if (block) {
        const node = block[0]
        const path = block[1]

        if (SlateElement.isElement(node)) {
          // If user is breaking in a head
          if (node.type === 'head') {
            insertBreakForHead(editor, selection, node, path)
            return;
          }

          const [parentNode, parentPath] = Editor.parent(editor, path)
          // console.log('[insertBreak] parentNode: ', parentNode)

          // If user is breaking in a list item
          if (SlateElement.isElement(parentNode) && parentNode.type === 'list-item') {
            assert(node.type === 'paragraph', 'Invalid node: ' + node)
            insertBreakForListItem(editor, selection, node, path, parentNode, parentPath)
            return;
          }
        }
      }
    }

    // insert a break as usual.
    insertBreak();
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor
    if (selection && Range.isCollapsed(selection)) {
      // Get the ancestor block element of the current selection.
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      // console.log('[deleteBackward] block: ', block)

      if (block) {
        const node = block[0]
        const path = block[1]

        if (SlateElement.isElement(node)) {
          if (node.type === 'head' && deleteBackwardForHead(editor, selection, node, path)) {
            return;
          } else if (node.type === 'paragraph' && deleteBackwardForParagraph(editor, selection, node, path)) {
            return;
          }

          const [parentNode, parentPath] = Editor.parent(editor, path)
          // If user is breaking in a list item
          if (SlateElement.isElement(parentNode) && parentNode.type === 'list-item') {
            assert(node.type === 'paragraph', 'Invalid node: ' + node)
            if (deleteBackwardForListItem(editor, selection, node, path, parentNode, parentPath)) {
              return;
            }
          }
        }
      }
    }

    deleteBackward(...args)
  }

  // Delete the selected fragment
  editor.deleteFragment = (...args) => {
    // const { selection } = editor
    // if (selection) {
    //   const [start, end] = Range.edges(selection)
    //   const startBlock = Editor.above(editor, { at: start, match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) })
    //   const endBlock = Editor.above(editor, { at: end, match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) })
    //   console.log('[deleteFragment] startBlock: ', startBlock)
    //   console.log('[deleteFragment] endBlock: ', endBlock)
    //   // if (startBlock && endBlock && startBlock[0].type === 'list-item' && endBlock[0].type === 'list-item') {
    //   //   // If the selection is across multiple list items, delete the list
    //   //   const startPath = startBlock[1]
    //   //   const endPath = endBlock[1]
    //   //   const [startParent] = Editor.parent(editor, startPath)
    //   //   const [endParent] = Editor.parent(editor, endPath)
    //   //   if (startParent === endParent) {
    //   //     Transforms.removeNodes(editor, { at: startPath })
    //   //   }
    //   // }
    // }

    deleteFragment(...args)
  }

  return editor
}
