import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
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
  const dialogTitleId = useId()
  const triggerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
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

  useEffect(() => {
    if (!isFullscreen) {
      return undefined
    }

    const trigger = triggerRef.current

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    closeButtonRef.current?.focus()
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [isFullscreen])

  if (diagram.error) {
    return (
      <div className="mermaid-diagram mermaid-diagram-error" role="alert">
        <strong>Mermaid render failed</strong>
        <span>{diagram.error}</span>
      </div>
    )
  }

  if (!diagram.svg) {
    return (
      <div
        className="mermaid-diagram mermaid-diagram-loading"
        role="status"
        aria-label="Rendering Mermaid diagram"
      />
    )
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`mermaid-diagram mermaid-diagram-trigger ${diagram.isLoading ? 'mermaid-diagram-loading' : ''}`}
        contentEditable={false}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label="Open Mermaid diagram in fullscreen"
        title="Open fullscreen preview"
        onClick={(event) => {
          event.stopPropagation()
          setIsFullscreen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            setIsFullscreen(true)
          }
        }}
        dangerouslySetInnerHTML={{ __html: diagram.svg }}
      />

      {isFullscreen &&
        createPortal(
          <div
            className={`mermaid-fullscreen-overlay ${theme === 'dark' ? 'mermaid-fullscreen-dark' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            onClick={(event) => {
              event.stopPropagation()
              setIsFullscreen(false)
            }}
          >
            <div className="mermaid-fullscreen-header">
              <span id={dialogTitleId}>Mermaid preview</span>
              <button
                ref={closeButtonRef}
                type="button"
                className="mermaid-fullscreen-close"
                aria-label="Close fullscreen preview"
                title="Close"
                onClick={() => setIsFullscreen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="mermaid-fullscreen-content">
              <div
                className="mermaid-fullscreen-diagram"
                role="img"
                aria-label="Mermaid diagram fullscreen preview"
                onClick={(event) => event.stopPropagation()}
                dangerouslySetInnerHTML={{ __html: diagram.svg }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default MermaidDiagram
