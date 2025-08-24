import React from 'react'
import { X, ExternalLink, FileText, AlertTriangle, Unlink } from 'lucide-react'
import { PageLinkValidationResult } from '../../utils/link-validator/BrokenPageLinksValidator'
import { useWorkspaceStore } from '@renderer/stores/workspaceStore'
import { handleOpenFile } from '@renderer/utils/fileOperations'

interface BrokenLinksDialogProps {
  isOpen: boolean
  onClose: () => void
  results: PageLinkValidationResult[]
}

const BrokenPageLinksDialog: React.FC<BrokenLinksDialogProps> = ({ isOpen, onClose, results }) => {
  const { currentWorkspace } = useWorkspaceStore()

  if (!isOpen) return null

  const totalBrokenLinks = results.reduce((sum, result) => sum + result.brokenLinks.length, 0)

  const handleFileClick = async (filePath: string) => {
    if (currentWorkspace) {
      await handleOpenFile(currentWorkspace.path, filePath, true)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Unlink className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Broken Pagelinks</h2>
            <span className="text-sm text-gray-500">
              ({totalBrokenLinks} broken links in {results.length} files)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <FileText className="w-16 h-16 text-green-500 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                All pagelinks are valid!
              </h3>
              <p className="text-gray-500">
                No broken pagelinks were found in your workspace.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {results.map((result) => (
                <div key={result.filePath} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* File header */}
                  <div
                    className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleFileClick(result.filePath)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{result.filePath}</span>
                      <span className="text-sm text-gray-500">
                        ({result.brokenLinks.length} broken link{result.brokenLinks.length > 1 ? 's' : ''})
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>

                  {/* Broken links list */}
                  <div className="divide-y divide-gray-100">
                    {result.brokenLinks.map((link, index) => (
                      <div key={index} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">
                                [[{link.linkText}]]
                              </code>
                              {link.lineNumber && (
                                <span className="text-xs text-gray-500">
                                  Line {link.lineNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Target: <span className="font-mono text-xs">{link.resolvedPath}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrokenPageLinksDialog