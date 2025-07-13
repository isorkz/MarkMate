import React from 'react'

interface DiffViewerProps {
  diffContent: string
}

interface DiffLine {
  type: 'context' | 'added' | 'removed' | 'header' | 'hunk'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diffContent }) => {
  const parseDiff = (diff: string): DiffLine[] => {
    const lines = diff.split('\n')
    const parsedLines: DiffLine[] = []
    let oldLineNumber = 0
    let newLineNumber = 0

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Hunk header (e.g., @@ -1,4 +1,6 @@)
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
        if (match) {
          oldLineNumber = parseInt(match[1])
          newLineNumber = parseInt(match[2])
        }
        parsedLines.push({
          type: 'hunk',
          content: line,
        })
      } else if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ') || line.startsWith('index ')) {
        // File headers
        parsedLines.push({
          type: 'header',
          content: line,
        })
      } else if (line.startsWith('+')) {
        // Added line
        parsedLines.push({
          type: 'added',
          content: line.substring(1),
          newLineNumber: newLineNumber++,
        })
      } else if (line.startsWith('-')) {
        // Removed line
        parsedLines.push({
          type: 'removed',
          content: line.substring(1),
          oldLineNumber: oldLineNumber++,
        })
      } else if (line.startsWith(' ')) {
        // Context line
        parsedLines.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
        })
      } else if (line.trim() === '') {
        // Empty line
        parsedLines.push({
          type: 'context',
          content: '',
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
        })
      }
    }

    return parsedLines
  }

  const getLineClasses = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-l-2 border-green-500'
      case 'removed':
        return 'bg-red-50 border-l-2 border-red-500'
      case 'context':
        return 'bg-white'
      case 'header':
        return 'bg-gray-100 text-gray-600 font-semibold'
      case 'hunk':
        return 'bg-blue-50 text-blue-800 font-medium'
      default:
        return 'bg-white'
    }
  }

  const getTextClasses = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'text-green-800'
      case 'removed':
        return 'text-red-800'
      case 'context':
        return 'text-gray-800'
      case 'header':
        return 'text-gray-600'
      case 'hunk':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  const getPrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      case 'context':
        return ' '
      default:
        return ''
    }
  }

  if (!diffContent.trim()) {
    return (
      <div className="p-4 text-center text-gray-500">
        No changes to display
      </div>
    )
  }

  const parsedLines = parseDiff(diffContent)

  return (
    <div className="font-mono text-sm">
      {parsedLines.map((line, index) => (
        <div
          key={index}
          className={`flex items-start ${getLineClasses(line.type)}`}
        >
          {/* Line numbers */}
          <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-400 bg-gray-50 border-r select-none">
            <div className="flex justify-between">
              <span>{line.oldLineNumber || ''}</span>
              <span>{line.newLineNumber || ''}</span>
            </div>
          </div>
          
          {/* Prefix (+/-/ ) */}
          <div className="flex-shrink-0 w-6 px-1 py-1 text-center select-none">
            <span className={getTextClasses(line.type)}>
              {getPrefix(line.type)}
            </span>
          </div>
          
          {/* Content */}
          <div className={`flex-1 px-2 py-1 ${getTextClasses(line.type)} break-all`}>
            {line.content}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DiffViewer