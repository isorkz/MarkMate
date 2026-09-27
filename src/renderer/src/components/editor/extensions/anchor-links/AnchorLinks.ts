import { Extension } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import GithubSlugger from 'github-slugger'
import toast from 'react-hot-toast'

const anchorLinksKey = new PluginKey<DecorationSet>('anchorLinks')

const createHeadingAnchors = (doc: Node): DecorationSet => {
  const slugger = new GithubSlugger()
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, { id: slugger.slug(node.textContent) })
      )
    }
  })

  // Decorations keep generated IDs out of the saved Markdown and undo history.
  return DecorationSet.create(doc, decorations)
}

export const navigateToAnchor = (view: EditorView, href: string): boolean => {
  if (!href.startsWith('#')) {
    return false
  }

  let id: string
  try {
    id = decodeURIComponent(href.slice(1))
  } catch {
    toast.error(`Invalid anchor link: ${href}`)
    return true
  }

  // Scope the lookup to this editor because other tabs can contain the same IDs.
  const target = id
    ? Array.from(view.dom.querySelectorAll<HTMLElement>('[id]')).find(
        (element) => element.id === id
      )
    : view.dom

  if (target) {
    // Collapse the old selection at the destination so editing menus close.
    const position = view.posAtDOM(target, 0)
    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(position))))

    if (!id) {
      view.dom.scrollTop = 0
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    toast.error(`Anchor not found: ${href}`)
  }

  return true
}

const handleAnchorClick = (view: EditorView, event: MouseEvent): boolean => {
  if (event.type === 'auxclick' ? event.button !== 1 : event.button !== 0) {
    return false
  }

  const link = event.target instanceof Element ? event.target.closest('a[href]') : null
  const href = link?.getAttribute('href')

  if (!link || !view.dom.contains(link) || !href?.startsWith('#')) {
    return false
  }

  event.preventDefault()
  return navigateToAnchor(view, href)
}

export const AnchorLinks = Extension.create({
  name: 'anchorLinks',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: anchorLinksKey,
        state: {
          init: (_, { doc }) => createHeadingAnchors(doc),
          apply: (transaction, decorations) =>
            transaction.docChanged ? createHeadingAnchors(transaction.doc) : decorations
        },
        props: {
          decorations: (state) => anchorLinksKey.getState(state),
          // DOM events also run in read-only mode, before native link navigation.
          handleDOMEvents: {
            click: handleAnchorClick,
            auxclick: handleAnchorClick
          }
        }
      })
    ]
  }
})
