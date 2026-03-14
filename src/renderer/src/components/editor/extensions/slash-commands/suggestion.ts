// Suggestion configuration for TipTap's suggestion plugin
// This handles the popup behavior, positioning, and lifecycle of the slash commands menu

import { ReactRenderer } from '@tiptap/react'
import { computePosition, flip, shift, offset } from '@floating-ui/dom'
import { commandsList } from './commands'
import { CommandsList, CommandsListRef } from './CommandsList'

function createVirtualElement(clientRect: () => DOMRect | null) {
  return {
    getBoundingClientRect: () => clientRect() ?? new DOMRect()
  }
}

// Configuration object for TipTap's suggestion plugin
// Defines how the slash commands popup behaves
export const suggestion = {
  // Filter commands based on user input after "/"
  items: ({ query }: { query: string }) => {
    const filteredItems = commandsList.filter(item =>
      item.title.toLowerCase().startsWith(query.toLowerCase())
    )
    return filteredItems
  },

  // Render function that creates and manages the popup
  render: () => {
    let reactRenderer: ReactRenderer
    let popup: HTMLElement | null = null
    let virtualElement: ReturnType<typeof createVirtualElement>

    const updatePosition = () => {
      if (!popup || !virtualElement) return
      computePosition(virtualElement, popup, {
        placement: 'bottom-start',
        middleware: [offset(4), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (popup) {
          Object.assign(popup.style, {
            left: `${x}px`,
            top: `${y}px`,
          })
        }
      })
    }

    return {
      // Called when suggestion popup should appear
      onStart: (props: any) => {
        reactRenderer = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        virtualElement = createVirtualElement(props.clientRect)

        popup = document.createElement('div')
        popup.style.position = 'absolute'
        popup.style.zIndex = '9999'
        popup.appendChild(reactRenderer.element)
        document.body.appendChild(popup)

        updatePosition()
      },

      // Called when popup needs to be updated (e.g., position change)
      onUpdate(props: any) {
        reactRenderer?.updateProps(props)

        if (!props.clientRect || !popup) {
          return
        }

        virtualElement = createVirtualElement(props.clientRect)
        updatePosition()
      },

      // Handle keyboard events
      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          if (popup) {
            popup.style.display = 'none'
          }
          return true
        }

        return (reactRenderer?.ref as CommandsListRef)?.onKeyDown(props)
      },

      // Cleanup when popup is closed
      onExit() {
        if (popup) {
          popup.remove()
          popup = null
        }
        if (reactRenderer) {
          reactRenderer.destroy()
        }
      },
    }
  },
}