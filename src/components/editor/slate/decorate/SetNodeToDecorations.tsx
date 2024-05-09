import { useCallback } from 'react'
import { Element as SlateElement, Editor, NodeEntry, Range, Node } from 'slate'
import { useSlate } from 'slate-react'
import { CodeElement } from '../Element'
import { getHighlighter, BundledLanguage } from 'shikiji'
import useSearchStore from '../../../../store/SearchStore'

const supportedLanguages = ['javascript', 'cpp', 'c++', 'python', 'java', 'html', 'shell', 'bash']

export const LanguageSelectMap = {
  'javascript': 'javascript',
  'cpp': 'cpp',
  'c++': 'cpp',
  'python': 'python',
  'java': 'java',
  'html': 'html',
  'bash': 'shell',
  'shell': 'shell',
}

const highlighter = await getHighlighter({
  themes: ['material-theme-palenight'],
  langs: supportedLanguages,
})

// Use decorate to
// 1. highlight the code blocks: https://github.com/ianstormtaylor/slate/blob/main/site/examples/code-highlighting.tsx
// 2. highlight the search results: https://github.com/ianstormtaylor/slate/blob/main/site/examples/search-highlighting.tsx
export const useDecorate = (editor: Editor): (([node, path]: NodeEntry) => Range[]) => {
  const searchResult = useSearchStore((state) => state.searchResult);

  return useCallback(
    ([node, path]) => {
      let ranges: Range[] = searchResult?.nodeToRangesMap.get(node) || []
      if (SlateElement.isElement(node) && node.type === 'code-line') {
        const rangesForCodeBlock = editor.nodeToDecorations?.get(node) || []
        ranges.push(...rangesForCodeBlock)
        return ranges
      }

      return ranges
    },
    [editor.nodeToDecorations, searchResult]
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

  const language = block.language ? (supportedLanguages.includes(block.language) ? block.language as BundledLanguage : 'text') : 'text';
  if (language === 'text') return nodeToDecorations
  const codeText = block.children.map(line => Node.string(line)).join('\n')
  const themedTokens = highlighter.codeToThemedTokens(codeText, {
    lang: language,
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

export const LanguageSelect = (props: JSX.IntrinsicElements['select']) => {
  return (
    <select
      data-test-id="language-select"
      contentEditable={false}
      className='absolute top-0 right-0 text-gray-400 text-xs p-1 z-10 bg-transparent'
      {...props}
    >
      <option value="cpp">C++</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
      <option value="shell">Shell</option>
      <option value="html">Html</option>
      <option value="javascript">Javascript</option>
      <option value="text">Text</option>
    </select>
  )
}