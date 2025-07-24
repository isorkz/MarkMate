import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const PageLinkParser = Extension.create({
  name: 'pageLinkParser',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pageLinkParser'),
        view(editorView) {
          let hasProcessed = false
          
          const processPageLinks = (view: any) => {
            const { tr } = view.state
            let hasChanges = false
            const pageLinkType = view.state.schema.nodes.pageLink
            if (!pageLinkType) {
              
              return
            }

            // Find [[page name]] patterns in text nodes
            // We need to collect all replacements first, then apply them in reverse order
            const allReplacements: { from: number, to: number, node: any }[] = []
            
            view.state.doc.descendants((node: any, pos: number) => {
              if (node.isText && node.text && node.text.includes('[[')) {
                const text = node.text
                
                const regex = /\[\[([^\]]+)\]\]/g
                let match

                while ((match = regex.exec(text)) !== null) {
                  const [fullMatch, linkText] = match
                  const from = pos + match.index
                  const to = from + fullMatch.length

                  const relativePath = linkText
                  const pageName = linkText.split('/').pop()?.replace(/\.[^.]*$/, '') || linkText

                  allReplacements.push({
                    from,
                    to,
                    node: pageLinkType.create({ pageName, relativePath })
                  })
                }
              }
            })

            // Sort replacements by position (highest first) to avoid position shifts
            allReplacements.sort((a, b) => b.from - a.from)
            
            // Apply all replacements
            allReplacements.forEach(replacement => {
              tr.replaceWith(replacement.from, replacement.to, replacement.node)
              hasChanges = true
            })

            if (hasChanges) {
              view.dispatch(tr)
              hasProcessed = true
            }
          }
          
          // Process content when view is created
          setTimeout(() => {
            if (!hasProcessed && editorView.state.doc.content.size > 0) {
              processPageLinks(editorView)
            }
          }, 500)
          
          // No update or destroy methods needed - this plugin only processes content once on file load
          // For user input is handled by addInputRules() in PageLink extension
          return {}
        }
      })
    ]
  }
})