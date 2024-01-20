import { useCallback } from 'react'
import { Element as SlateElement, Editor, NodeEntry, Range, Node } from 'slate'
import { useSlate } from 'slate-react'
import { CodeElement } from '../Element'
import { getHighlighter } from 'shikiji'

const highlighter = await getHighlighter({
  themes: ['material-theme-palenight'],
  langs: ['javascript', 'cpp'],
})

// Use decorate to highlight the code blocks.
export const useDecorate = (editor: Editor): (([node, path]: NodeEntry) => Range[]) => {
  return useCallback(
    ([node, path]) => {
      if (SlateElement.isElement(node) && node.type === 'code-line') {
        const ranges = editor.nodeToDecorations?.get(node) || []
        return ranges
      }

      return []
    },
    [editor.nodeToDecorations]
  )
}

// precalculate editor.nodeToDecorations map to use it inside decorate function then
export const SetNodeToDecorations = () => {
  const editor = useSlate()

  const blockEntries = Array.from(
    Editor.nodes(editor, {
      at: [],
      mode: 'highest',
      match: n => SlateElement.isElement(n) && n.type === 'code',
    })
  ) as NodeEntry<CodeElement>[]

  const nodeToDecorations: Map<SlateElement, Range[]> = mergeMaps(
    ...blockEntries.map(getChildNodeToDecorations)
  )

  editor.nodeToDecorations = nodeToDecorations

  return null
}

const mergeMaps = <K, V>(...maps: Map<K, V>[]) => {
  const map = new Map<K, V>()

  for (const m of maps) {
    for (const item of m) {
      map.set(...item)
    }
  }

  return map
}

const getChildNodeToDecorations = ([
  block,
  blockPath,
]: NodeEntry<CodeElement>) => {
  const nodeToDecorations = new Map<SlateElement, Range[]>()

  const codeText = block.children.map(line => Node.string(line)).join('\n')
  const language = block.language
  const themedTokens = highlighter.codeToThemedTokens(codeText, {
    lang: 'cpp',
  })
  const blockChildren = block.children as SlateElement[]

  for (let index = 0; index < themedTokens.length; index++) {
    const lineTokens = themedTokens[index]
    const element = blockChildren[index]
    if (!nodeToDecorations.has(element)) {
      nodeToDecorations.set(element, [])
    }

    let start = 0
    for (const token of lineTokens) {
      const length = token.content.length
      if (!length) {
        continue
      }

      const end = start + length

      const path = [...blockPath, index, 0]
      const range = {
        anchor: { path, offset: start },
        focus: { path, offset: end },
        color: token.color,
      }
      nodeToDecorations.get(element)!.push(range)

      start = end
    }
  }

  return nodeToDecorations
}