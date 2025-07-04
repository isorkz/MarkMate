import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TabProps {
  tab: {
    id: string
    title: string
    isDirty: boolean
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
      className={`tab ${tab.isActive ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`}
      onClick={() => onSelect(tab.id)}
    >
      <span className="truncate max-w-32">{tab.title}</span>
      <button
        className="ml-2 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
        onClick={(e) => {
          e.stopPropagation()
          onClose(tab.id)
        }}
      >
        ×
      </button>
    </div>
  )
}

const TabManager: React.FC = () => {
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
    <div className="tab-bar">
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

export default TabManager