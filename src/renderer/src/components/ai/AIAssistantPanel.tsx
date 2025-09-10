import React from 'react'
import Header from './Header'
import ChatPanel from './ChatPanel'
import InputPanel from './InputPanel'
import { useSettingsStore } from '../../stores/settingsStore'

const AIAssistantPanel: React.FC = () => {
  const { aiSettings } = useSettingsStore()

  return (
    <div className={`${aiSettings.isMaximized
        ? 'fixed top-0 left-0 w-full h-full z-50'
        : 'h-full'
      } bg-white border-l border-gray-200 flex flex-col`}>
      <Header />
      <ChatPanel />
      <InputPanel />
    </div>
  )
}

export default AIAssistantPanel