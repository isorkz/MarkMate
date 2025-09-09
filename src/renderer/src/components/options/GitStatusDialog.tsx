import React from 'react'
import { X, Terminal } from 'lucide-react'

interface GitStatusDialogProps {
  isOpen: boolean
  onClose: () => void
  gitStatusResult: {
    simpleGitStatus: string
    gitStatus: string
  } | null
}

const GitStatusDialog: React.FC<GitStatusDialogProps> = ({
  isOpen,
  onClose,
  gitStatusResult
}) => {
  if (!isOpen || !gitStatusResult) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Git Status</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {/* Raw Git Status Output */}
            <div>
              <h3 className="text-md font-semibold mb-3 text-gray-800">Git Status Output</h3>
              <pre className="p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap border border-gray-200 bg-gray-50">
                {gitStatusResult.gitStatus}
              </pre>
            </div>

            {/* Simple Git Status Object */}
            <div>
              <h3 className="text-md font-semibold mb-3 text-gray-800">Simple Git Status Object</h3>
              <pre className="p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-200 bg-gray-50">
                {gitStatusResult.simpleGitStatus}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default GitStatusDialog