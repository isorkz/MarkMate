import React from 'react'
import { CloudCheck, CloudAlert, RefreshCw, FileClock, FileWarning, ShieldQuestion } from 'lucide-react'
import { SyncStatus } from 'src/shared/types/git'

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
      case 'conflict':
        return <FileWarning className="w-4 h-4 text-orange-500" />
      case 'out-of-date':
        return <FileClock className="w-4 h-4 text-blue-500" />
      default:
        return <ShieldQuestion className="w-4 h-4 text-red-500" />
    }
  }

  const getTooltip = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing changes...'
      case 'synced':
        return 'File is up to date'
      case 'error':
        return 'Sync failed'
      case 'conflict':
        return 'Conflicts need to be resolved'
      case 'out-of-date':
        return 'File is out of date, waiting for sync'
      default:
        return 'Unknown sync status'
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