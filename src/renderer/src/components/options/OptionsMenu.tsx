import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Settings, GalleryVerticalEnd } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

interface OptionsMenuProps {
  onShowVersionHistory: () => void
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({ onShowVersionHistory }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { openSettings } = useSettingsStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOpenSettings = () => {
    openSettings('general')
    setIsOpen(false)
  }

  const handleShowVersionHistory = () => {
    onShowVersionHistory()
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        style={{ WebkitAppRegion: 'no-drag' }}
        title="Options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 text-sm text-gray-900 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={handleShowVersionHistory}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <GalleryVerticalEnd className="w-4 h-4" />
            Version History
          </button>

          <div className="mx-3 border-t border-gray-100 my-0.5" />

          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      )}
    </div>
  )
}

export default OptionsMenu