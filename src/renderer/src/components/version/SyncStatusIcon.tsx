import React from 'react'
import { CloudCheck, CloudAlert, RefreshCw, GitBranch } from 'lucide-react'

export type SyncStatus = 'out-of-date' | 'syncing' | 'synced' | 'error'

interface SyncStatusIconProps {
  status: SyncStatus
  className?: string
}

const SyncStatusIcon: React.FC<SyncStatusIconProps> = ({ status, className = '' }) => {
  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
      case 'synced':
        return <CloudCheck className="w-4 h-4 text-green-500" />
      case 'error':
        return <CloudAlert className="w-4 h-4 text-red-500" />
      case 'out-of-date':
      default:
        return <GitBranch className="w-4 h-4 text-orange-500" />
    }
  }

  const getTooltip = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing changes...'
      case 'synced':
        return 'All changes synced'
      case 'error':
        return 'Sync failed'
      case 'out-of-date':
      default:
        return 'Changes not synced'
    }
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      title={getTooltip()}
    >
      {getIcon()}
    </div>
  )
}

export default SyncStatusIcon