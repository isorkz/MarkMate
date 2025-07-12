import React from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatDate } from '../../../../shared/commonUtils'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TabProps {
  tab: {
    id: string
    title: string
    hasUnsavedChanges: boolean
    isPinned?: boolean
  }
  isActive: boolean
  onClose: (id: string) => void
  onSelect: (id: string) => void
  onPin: (id: string) => void
}

const Tab: React.FC<TabProps> = ({ tab, isActive, onClose, onSelect, onPin }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, WebkitAppRegion: 'no-drag' }}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer min-w-0 flex-shrink-0
            ${isActive ? 'bg-white border-b-2 border-b-blue-500' : 'hover:bg-gray-100'}
      `}
      onClick={() => onSelect(tab.id)}
      onDoubleClick={() => onPin(tab.id)}
    >
      <span className={`text-sm truncate max-w-32 ${!tab.isPinned ? 'italic' : ''}`}>
        {tab.title}
      </span>
      {tab.hasUnsavedChanges && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
      )}
      <button
        className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onClose(tab.id)
        }}
      >
        <X className="w-3 h-3 text-gray-500" />
      </button>
    </div>
  )
}

const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs, pinTab } = useEditorStore()
  const { settings } = useSettingsStore()

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const handleCloseTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.hasUnsavedChanges) {
      const confirmed = window.confirm(
        `"${tab.title}" has unsaved changes. Are you sure you want to close it?`
      )
      if (!confirmed) {
        return
      }
    }
    closeTab(tabId)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = tabs.findIndex(tab => tab.id === active.id)
      const newIndex = tabs.findIndex(tab => tab.id === over.id)
      reorderTabs(oldIndex, newIndex)
    }
  }

  return (
    <div
      className={`flex bg-gray-50 border-b border-gray-200 min-h-[40px] ${!settings.sidebarVisible ? 'ml-32' : ''}`}
      style={{ WebkitAppRegion: 'drag' }}
    >
      {tabs.length > 0 ? (
        <>
          <div className="flex flex-1 overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={tabs.map(tab => tab.id)} strategy={horizontalListSortingStrategy}>
                {tabs.map(tab => (
                  <Tab
                    key={tab.id}
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onClose={handleCloseTab}
                    onSelect={setActiveTab}
                    onPin={pinTab}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Right side info - fixed width */}
          {activeTab && (
            <div
              className="flex items-center px-4 text-xs text-gray-500 border-l border-gray-200 whitespace-nowrap flex-shrink-0"
              style={{ WebkitAppRegion: 'drag', minWidth: '150px' }}
            >
              Modified {formatDate(activeTab.lastModified)}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}

export default TabBar