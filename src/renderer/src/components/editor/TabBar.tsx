import React from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TabProps {
  tab: {
    id: string
    title: string
    hasUnsavedChanges: boolean
    isActive: boolean
  }
  onClose: (id: string) => void
  onSelect: (id: string) => void
}

const Tab: React.FC<TabProps> = ({ tab, onClose, onSelect }) => {
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
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer min-w-0 flex-shrink-0
            ${tab.isActive ? 'bg-white border-b-2 border-b-blue-500' : 'hover:bg-gray-100'}
      `}
      onClick={() => onSelect(tab.id)}
    >
      <span className="text-sm truncate max-w-32">
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
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useEditorStore()

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

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="flex bg-gray-50 border-b border-gray-200 overflow-x-auto">
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
              onClose={closeTab}
              onSelect={setActiveTab}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default TabBar