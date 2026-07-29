export type MermaidTheme = 'default' | 'dark'

let diagramId = 0
let renderQueue: Promise<void> = Promise.resolve()
let mermaidModule: Promise<typeof import('mermaid')> | undefined

export const renderMermaid = (definition: string, theme: MermaidTheme): Promise<string> => {
  const render = async (): Promise<string> => {
    mermaidModule ??= import('mermaid')
    const { default: mermaid } = await mermaidModule

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme
    })

    diagramId += 1
    const { svg } = await mermaid.render(`markmate-mermaid-${diagramId}`, definition)
    return svg
  }

  const result = renderQueue.then(render, render)
  renderQueue = result.then(
    () => undefined,
    () => undefined
  )

  return result
}
