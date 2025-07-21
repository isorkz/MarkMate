// React component for rendering the slash commands dropdown menu
// This component displays a list of available commands and handles keyboard navigation

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Command } from './commands'

export interface CommandsListProps {
  items: Command[]
  command: (item: Command) => void
}

export interface CommandsListRef {
  onKeyDown: ({ event }: { event: KeyboardEvent }) => boolean
}

// Dropdown component that shows available commands when user types "/"
// Supports keyboard navigation (arrow keys, enter, escape)
export const CommandsList = forwardRef<CommandsListRef, CommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Execute the selected command
  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  // Navigate to previous command in the list
  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  // Navigate to next command in the list
  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  // Execute the currently selected command
  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  // Reset selection when items change (e.g., when filtering)
  useEffect(() => setSelectedIndex(0), [props.items])

  // Expose keyboard handlers to parent component
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          className={`flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          <div className="mr-3 text-gray-500 dark:text-gray-400">
            {item.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {item.title}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
})

CommandsList.displayName = 'CommandsList'