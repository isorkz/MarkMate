import React, { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { renderMermaid } from '../utils/mermaidRenderer'

interface MermaidDiagramProps {
  definition: string
}

interface DiagramState {
  svg: string
  error: string
  isLoading: boolean
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.split('\n')[0]
  }

  return 'Invalid Mermaid syntax'
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ definition }) => {
  const theme = useSettingsStore((state) => state.appearanceSettings.theme)
  const [diagram, setDiagram] = useState<DiagramState>({
    svg: '',
    error: '',
    isLoading: true
  })

  useEffect(() => {
    let cancelled = false

    if (!definition.trim()) {
      setDiagram({ svg: '', error: 'Mermaid diagram is empty', isLoading: false })
      return () => {
        cancelled = true
      }
    }

    setDiagram((current) => ({ ...current, error: '', isLoading: true }))

    const timeoutId = window.setTimeout(async () => {
      try {
        const svg = await renderMermaid(definition, theme === 'dark' ? 'dark' : 'default')

        if (!cancelled) {
          setDiagram({ svg, error: '', isLoading: false })
        }
      } catch (error) {
        if (!cancelled) {
          setDiagram({ svg: '', error: getErrorMessage(error), isLoading: false })
        }
      }
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [definition, theme])

  if (diagram.error) {
    return (
      <div className="mermaid-diagram mermaid-diagram-error" role="alert">
        <strong>Mermaid render failed</strong>
        <span>{diagram.error}</span>
      </div>
    )
  }

  return (
    <div
      className={`mermaid-diagram ${diagram.isLoading ? 'mermaid-diagram-loading' : ''}`}
      role="img"
      aria-label="Mermaid diagram"
      dangerouslySetInnerHTML={{ __html: diagram.svg }}
    />
  )
}

export default MermaidDiagram
