import React, { useState, useEffect } from 'react'
import { History, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { Tab, useEditorStore } from '../../stores/editorStore'
import { formatDate } from '../../../../shared/commonUtils'

interface VersionHistoryItem {
  hash: string
  message: string
  date: Date
  author: string
  filePath: string
}

interface VersionHistoryProps {
  isOpen: boolean
  onClose: () => void
  tab: Tab
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ isOpen, onClose, tab }) => {
  const [versions, setVersions] = useState<VersionHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<VersionHistoryItem | null>(null)
  const [previewMode, setPreviewMode] = useState<'diff' | 'content'>('content')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [previousVersionContent, setPreviousVersionContent] = useState<string>('')

  const { currentWorkspace } = useWorkspaceStore()
  const { openFile } = useEditorStore()

  useEffect(() => {
    if (isOpen && currentWorkspace && tab.filePath) {
      loadVersionHistory()
    }
  }, [isOpen, currentWorkspace, tab.filePath])

  const loadVersionHistory = async () => {
    if (!currentWorkspace) return

    setLoading(true)
    try {
      // Ensure repository is initialized
      // await window.electron.ipcRenderer.invoke('git:init', currentWorkspace.path)

      const history = await window.electron.ipcRenderer.invoke('git:history', currentWorkspace.path, tab.filePath)
      const versionsWithDates = history.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }))
      setVersions(versionsWithDates)
    } catch (error) {
      console.error('Failed to load version history:', error)
      toast.error('Failed to load version history: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewVersion = async (version: VersionHistoryItem) => {
    if (!currentWorkspace) return

    setLoading(true)
    try {
      // Get the selected version content
      const content = await window.electron.ipcRenderer.invoke('git:get-file-commit', currentWorkspace.path, tab.filePath, version.hash)

      // Find the previous version
      const currentVersionIndex = versions.findIndex(v => v.hash === version.hash)
      const previousVersion = versions[currentVersionIndex + 1] // Next in array is previous in time

      let previousContent = ''
      if (previousVersion) {
        // Get the previous version content
        previousContent = await window.electron.ipcRenderer.invoke('git:get-file-commit', currentWorkspace.path, tab.filePath, previousVersion.hash) || ''
      } else {
        // This is the first commit, compare with empty content
        previousContent = ''
      }

      if (content !== null) {
        setPreviewContent(content)
        setPreviousVersionContent(previousContent)
        setSelectedVersion(version)
      }
    } catch (error) {
      console.error('Failed to preview version:', error)
      toast.error('Failed to preview version: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreVersion = async (version: VersionHistoryItem) => {
    if (!currentWorkspace) return

    const confirmed = confirm(`Are you sure you want to restore to this version?\n\nThis will overwrite the current content and create a new commit.`)
    if (!confirmed) return

    setLoading(true)
    try {
      await window.electron.ipcRenderer.invoke('git:restore', currentWorkspace.path, tab.filePath, version.hash)

      // Reload the file in the editor
      const content = await window.electron.ipcRenderer.invoke('git:get-file-commit', currentWorkspace.path, tab.filePath, 'HEAD')
      if (content) {
        await openFile(tab.filePath, content)
      }

      // Refresh version history
      await loadVersionHistory()

      toast.success('File restored successfully!')
    } catch (error) {
      console.error('Failed to restore version:', error)
      toast.error('Failed to restore file')
    } finally {
      setLoading(false)
    }
  }

  // Simple diff function to highlight changes
  const createDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const maxLines = Math.max(oldLines.length, newLines.length)

    const diffLines: Array<{ type: string; content: string; lineNum: number }> = []

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || ''
      const newLine = newLines[i] || ''

      if (oldLine === newLine) {
        diffLines.push({ type: 'equal', content: oldLine, lineNum: i + 1 })
      } else {
        if (oldLine && !newLine) {
          diffLines.push({ type: 'removed', content: oldLine, lineNum: i + 1 })
        } else if (!oldLine && newLine) {
          diffLines.push({ type: 'added', content: newLine, lineNum: i + 1 })
        } else {
          diffLines.push({ type: 'changed-old', content: oldLine, lineNum: i + 1 })
          diffLines.push({ type: 'changed-new', content: newLine, lineNum: i + 1 })
        }
      }
    }

    return diffLines
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[85vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-500 mt-1">{tab.filePath}</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview Panel */}
          <div className="w-5/7 flex flex-col bg-white">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Preview</h3>
                  {selectedVersion && (
                    <div className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                        {(selectedVersion.author || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span>{selectedVersion.message}</span>
                      <p className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                        {selectedVersion.hash.substring(0, 8)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview Mode Toggle */}
                {selectedVersion && (
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('content')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${previewMode === 'content' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Content
                    </button>
                    <button
                      onClick={() => setPreviewMode('diff')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${previewMode === 'diff' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedVersion ? (
                <div className="h-full overflow-y-auto">
                  {previewMode === 'diff' ? (
                    // Diff view
                    <div className="p-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-white border-b border-gray-200 p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                              <span>Added</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                              <span>Removed</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-mono max-h-96 overflow-y-auto">
                          {createDiff(previousVersionContent, previewContent).map((line, index) => (
                            <div
                              key={index}
                              className={`px-4 py-1 flex items-start ${line.type === 'equal' ? 'bg-white' :
                                line.type === 'added' || line.type === 'changed-new' ? 'bg-green-50' :
                                  line.type === 'removed' || line.type === 'changed-old' ? 'bg-red-50' :
                                    'bg-white'
                                }`}
                            >
                              <span className="inline-block w-10 text-gray-400 text-xs mr-3 select-none text-right">
                                {line.lineNum}
                              </span>
                              <span className={`flex-1 ${line.type === 'added' || line.type === 'changed-new' ? 'text-green-700' :
                                line.type === 'removed' || line.type === 'changed-old' ? 'text-red-700' :
                                  'text-gray-700'
                                }`}>
                                <span className="inline-block w-4 text-center">
                                  {line.type === 'added' || line.type === 'changed-new' ? '+' :
                                    line.type === 'removed' || line.type === 'changed-old' ? '−' :
                                      ''}
                                </span>
                                {line.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Content view
                    <div className="p-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {previewContent}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-600 mb-2">Select a version</p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Choose a version from the list to view its content and see what changed.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Version List */}
          <div className="w-2/7 border-r border-gray-100 flex flex-col bg-gray-50">
            <div className="p-6 border-b border-gray-100 bg-white">
              <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Versions ({versions.length})</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && versions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p>Loading versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">No versions yet</p>
                  <p className="text-sm mb-6 text-gray-500 max-w-xs mx-auto">Start creating versions by making changes and saving your document.</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={version.hash}
                      onClick={() => handlePreviewVersion(version)}
                      title={version.message}
                      className={`group p-4 rounded-lg border cursor-pointer transition-all duration-200 ${selectedVersion?.hash === version.hash
                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                        : 'border-transparent bg-white hover:border-gray-200 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-start justify-between overflow-x-hidden">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {version.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(version.date)} • {version.author || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestoreVersion(version)
                              }}
                              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              title="Restore to this version"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VersionHistory