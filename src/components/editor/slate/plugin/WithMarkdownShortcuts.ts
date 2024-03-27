import { Editor, Transforms, Element as SlateElement, Text, Range, Point, Node, Path } from 'slate'
import { ListElement } from '../Element'

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
  const { insertText, deleteBackward, insertBreak } = editor;

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
      console.log('insertText above() block', block)
      console.log('insertText above() parent', parentNode)
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

          Transforms.setNodes<SlateElement>(editor, element, {
            match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
          })

          if (element.type === 'list-item') {
            // Also insert a new parent node to act as the list container
            const list: ListElement = {
              type: 'list',
              children: [],
            }
            Transforms.wrapNodes(editor, list, {
              match: n =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === 'list-item',
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
      // Editor.nodes to get all the nodes in the current selection.
      // [node] is to get the first node in the array. It's a tuple of [node, path], where 'node' is the node itself, and 'path' is the path of the node.
      const [node] = Editor.nodes<SlateElement>(editor, {
        match: n => SlateElement.isElement(n),
        // mode: 'highest' will return the highest matching node, which is the parent node of the current selection.
        // mode: 'lowest' will return the lowest matching node, which is the current selection itself.
        mode: 'lowest'
      })

      if (SlateElement.isElement(node[0])) {
        switch (node[0].type) {
          case 'head':
            // Create a new paragraph after the current head. Otherwise, it will continue to be a head.
            Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
            return;
          case 'list-item':
            // If the current list item is empty, remove it and insert a new paragraph after the list.
            if (node[0].children.length === 1 && Text.isText(node[0].children[0]) && node[0].children[0].text === '') {
              const path = node[1]
              const [parentNode, parentPath] = Editor.parent(editor, path)
              if (SlateElement.isElement(parentNode) && parentNode.type === 'list') {
                Transforms.removeNodes(editor, { at: path })
                Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: Path.next(parentPath) })
                // Set the cursor to the start of the new paragraph
                Transforms.select(editor, Editor.start(editor, Path.next(parentPath)))
                return;
              }
            }
        }
      }
    }
    insertBreak();
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const block = Editor.above(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })

      if (block) {
        const blockNode = block[0] as SlateElement
        const blockPath = block[1]
        let [parentNode, parentPath] = Editor.parent(editor, blockPath)

        const start = Editor.start(editor, blockPath)
        const previous = Editor.previous(editor, {
          match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        })
        const before = Editor.before(editor, blockPath)
        console.log('deleteBackward selection', selection)
        console.log('deleteBackward blockNode', blockNode)
        console.log('deleteBackward blockPath', blockPath)
        console.log('deleteBackward start', start)
        console.log('deleteBackward selection.anchor',)
        console.log('deleteBackward parentNode', parentNode)
        console.log('deleteBackward parentPath', parentPath)
        console.log('deleteBackward previous', previous)
        console.log('deleteBackward before', before)

        if (Point.equals(selection.anchor, start)) {
          // If the user is deleting at the beginning of a head node, convert it to a paragraph.
          if (blockNode.type === 'head') {
            const newProperties: Partial<SlateElement> = {
              type: 'paragraph',
            }
            Transforms.setNodes(editor, newProperties)
            return;
          } else if (blockNode.type === 'paragraph' && parentNode) {
            parentNode = parentNode as SlateElement
            // If the user is deleting at the beginning of a list-item node, convert it to a paragraph and lift it, and it won't belong to the list anymore.
            if (parentNode.type === 'list-item') {
              Transforms.unwrapNodes(editor, { at: parentPath });
              Transforms.liftNodes(editor, { at: parentPath });
              return;
            }
          } else if (blockNode.type === 'list-item') {
            // If the user is deleting at the beginning of a list-item node, convert it to a paragraph and lift it, and it won't belong to the list anymore.
            Transforms.unwrapNodes(editor, { at: blockPath });
            Transforms.liftNodes(editor, { at: blockPath });
            return;
          }
        }

        if (Path.equals(blockPath, [0])) {
          // If the user is deleting an empty paragraph node, remove it.
          if (blockNode.type === 'paragraph') {
            const leaf = Node.leaf(editor, selection.focus.path)
            if (leaf.text?.length === 0) {
              Transforms.delete(editor, { at: blockPath })
              return
            }
          }
        } else {
          parentNode = parentNode as SlateElement
          // If the user is deleting an empty list item, remove it and the list.
          // if (parentNode.type === 'list-item' && blockNode.children.length === 1 && Text.isText(blockNode.children[0]) && blockNode.children[0].text === '') {
          //   Transforms.removeNodes(editor, {
          //     at: block
          //   }
        }
      }
      // if (selection && Range.isCollapsed(selection)) {
      //   const match = Editor.above(editor, {
      //     match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      //   })

      //   if (match) {
      //     const [block, path] = match
      //     const start = Editor.start(editor, path)

      //     console.log('deleteBackward block', block)
      //     console.log('path', path)
      //     console.log('start', start)
      //     if (
      //       !Editor.isEditor(block) &&
      //       SlateElement.isElement(block) &&
      //       block.type !== 'paragraph' && block.type != 'code-line' &&
      //       Point.equals(selection.anchor, start)
      //     ) {
      //       const newProperties: Partial<SlateElement> = {
      //         type: 'paragraph',
      //       }
      //       Transforms.setNodes(editor, newProperties)

      //       if (block.type === 'list-item') {
      //         Transforms.unwrapNodes(editor, {
      //           match: n =>
      //             !Editor.isEditor(n) &&
      //             SlateElement.isElement(n) &&
      //             n.type === 'list',
      //           split: true,
      //         })
      //       }

      //       return
      //     }
      //   }
      // }
    }
    deleteBackward(...args)
  }

  return editor
}