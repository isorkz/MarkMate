// Suggestion configuration for TipTap's suggestion plugin
// This handles the popup behavior, positioning, and lifecycle of the slash commands menu

import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { commandsList } from './commands'
import { CommandsList, CommandsListRef } from './CommandsList'

// Configuration object for TipTap's suggestion plugin
// Defines how the slash commands popup behaves
export const suggestion = {
  // Filter commands based on user input after "/"
  items: ({ query }: { query: string }) => {
    const filteredItems = commandsList.filter(item =>
      item.title.toLowerCase().startsWith(query.toLowerCase())
    )
    // Return filtered items (empty array will trigger popup to close)
    return filteredItems
  },

  // Render function that creates and manages the popup
  render: () => {
    let reactRenderer: ReactRenderer
    let popup: any

    return {
      // Called when suggestion popup should appear
      onStart: (props: any) => {
        // Create React component renderer for the commands list
        reactRenderer = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        // Create Tippy.js popup with the React component
        const tippyInstances = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: reactRenderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
        
        popup = tippyInstances[0]
      },

      // Called when popup needs to be updated (e.g., position change)
      onUpdate(props: any) {
        reactRenderer?.updateProps(props)

        if (!props.clientRect || !popup) {
          return
        }

        // Update popup position
        popup.setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      // Handle keyboard events
      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          if (popup) {
            popup.hide()
          }
          return true
        }

        // Delegate keyboard handling to the CommandsList component
        return (reactRenderer?.ref as CommandsListRef)?.onKeyDown(props)
      },

      // Cleanup when popup is closed
      onExit() {
        if (popup) {
          popup.destroy()
          popup = null
        }
        if (reactRenderer) {
          reactRenderer.destroy()
        }
      },
    }
  },
}