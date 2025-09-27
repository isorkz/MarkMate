import { Editor } from '@tiptap/react'

export class CodeBlockUtils {
  static indentTab(editor: Editor): boolean {
    const { $from, from, to } = editor.state.selection
    const node = $from.node()

    if (node.type.name !== 'codeBlock') return false

    const codeBlockStart = $from.start()
    const content = node.textContent

    if (from === to) {
      // Single line: insert at line start
      const posInBlock = from - codeBlockStart
      const beforeCursor = content.slice(0, posInBlock)
      const lineStart = beforeCursor.lastIndexOf('\n') + 1
      editor.view.dispatch(editor.state.tr.insertText('  ', codeBlockStart + lineStart))
    } else {
      // Multi-line: indent all affected lines
      const startPos = content.slice(0, from - codeBlockStart).lastIndexOf('\n') + 1
      const endPos = content.slice(to - codeBlockStart).indexOf('\n')
      const lastLineEnd = endPos === -1 ? content.length : to - codeBlockStart + endPos

      const lines = content.slice(startPos, lastLineEnd).split('\n')
      const indentedText = lines.map(line => '  ' + line).join('\n')

      const replaceFrom = codeBlockStart + startPos
      const replaceTo = codeBlockStart + lastLineEnd

      editor.view.dispatch(editor.state.tr.replaceWith(replaceFrom, replaceTo, editor.state.schema.text(indentedText)))

      setTimeout(() => {
        editor.commands.setTextSelection({ from: from + 2, to: to + lines.length * 2 })
      }, 0)
    }
    return true
  }

  static unindentTab(editor: Editor): boolean {
    const { $from, from, to } = editor.state.selection
    const node = $from.node()

    if (node.type.name !== 'codeBlock') return false

    const codeBlockStart = $from.start()
    const content = node.textContent

    if (from === to) {
      // Single line: remove spaces from line start
      const posInBlock = from - codeBlockStart
      const lineStart = content.slice(0, posInBlock).lastIndexOf('\n') + 1
      const lineStartPos = codeBlockStart + lineStart
      const currentLine = content.slice(lineStart).split('\n')[0]

      if (currentLine.startsWith('  ')) {
        editor.view.dispatch(editor.state.tr.delete(lineStartPos, lineStartPos + 2))
      } else if (currentLine.startsWith(' ')) {
        editor.view.dispatch(editor.state.tr.delete(lineStartPos, lineStartPos + 1))
      }
    } else {
      // Multi-line: unindent all affected lines
      const startPos = content.slice(0, from - codeBlockStart).lastIndexOf('\n') + 1
      const endPos = content.slice(to - codeBlockStart).indexOf('\n')
      const lastLineEnd = endPos === -1 ? content.length : to - codeBlockStart + endPos

      const lines = content.slice(startPos, lastLineEnd).split('\n')
      const unindentedLines = lines.map(line =>
        line.startsWith('  ') ? line.slice(2) :
          line.startsWith(' ') ? line.slice(1) : line
      )

      const spacesRemoved = lines.reduce((sum, line) =>
        sum + (line.startsWith('  ') ? 2 : line.startsWith(' ') ? 1 : 0), 0
      )

      const replaceFrom = codeBlockStart + startPos
      const replaceTo = codeBlockStart + lastLineEnd

      editor.view.dispatch(editor.state.tr.replaceWith(replaceFrom, replaceTo, editor.state.schema.text(unindentedLines.join('\n'))))

      setTimeout(() => {
        const firstLineRemoved = lines[0]?.startsWith('  ') ? 2 : lines[0]?.startsWith(' ') ? 1 : 0
        editor.commands.setTextSelection({
          from: Math.max(from - firstLineRemoved, replaceFrom),
          to: Math.max(to - spacesRemoved, from)
        })
      }, 0)
    }
    return true
  }
}