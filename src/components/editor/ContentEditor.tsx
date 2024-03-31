import { useCallback, useMemo, useEffect, useRef } from 'react'
import { Descendant, Transforms, createEditor, Element as SlateElement } from 'slate'
import { Editor } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'
import useStore from '../../store/MStore'
import { RenderElement, RenderLeaf } from './slate/render/RenderElement'
import { markdownSourceToSlateNodes } from './slate/parser/ParseMarkdownSourceToSlateNodes'
import { slateNodesToMarkdownSource } from './slate/parser/ParseSlateNodesToMarkdownSource'
import { withMarkdownShortcuts } from './slate/plugin/WithMarkdownShortcuts'
import { SlateEditorUtils } from './slate/SlateEditorUtils'
import { SetNodeToDecorations, useDecorate } from './slate/decorate/SetNodeToDecorations'
import { DefaultEmptySlateNodes } from './slate/Element'

const ContentEditor = () => {
  // Rich text editor: Slate, wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
  // withMarkdownShortcuts: is a custom plugin to modify the editor's behavior.
  // withHistory: to add undo/redo history to the editor.
  const editor = useMemo(() => withMarkdownShortcuts(withReact(withHistory(createEditor()))), [])

  const currentDocument = useStore((state) => state.currentDocument);
  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const updateSlateNodes = useStore((state) => state.updateSlateNodes);

  const editorRef = useRef<HTMLDivElement>(null);

  // useRef: to get the current value of a variable, and it will not cause a re-render.
  // Otherwise, for onSave() triggered by global shortcut, the currentDocumentRef will be the old value.
  const currentDocumentRef = useRef(currentDocument);

  useEffect(() => {
    currentDocumentRef.current = currentDocument;
  }, [currentDocument]);

  const decorate = useDecorate(editor)

  const onChange = (value: Descendant[]) => {
    updateSlateNodes(value)
  }

  const handleDivClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Check if the click target is the editor or a child of the editor
    if (editorRef.current && (editorRef.current === event.target || editorRef.current.contains(event.target as Node))) {
      return;
    }

    // Focus the editor
    ReactEditor.focus(editor);

    // Move the cursor to the end of the document
    const end = Editor.end(editor, []);
    Transforms.setSelection(editor, { anchor: end, focus: end });
  }

  const onMarkdownSource = () => {
    const markdownSource = slateNodesToMarkdownSource(currentDocument.slateNodes)
    updateSourceContent(markdownSource)
  }

  const onLogMarkdownSource = () => {
    console.log('slateNodes: ', currentDocument.slateNodes)
    const markdownSource = slateNodesToMarkdownSource(currentDocument.slateNodes)
    console.log('markdownSource: ', markdownSource)
  }

  const onSave = () => {
    try {
      console.log('saving slateNodes: ', currentDocumentRef.current.slateNodes)
      if (currentDocumentRef.current.filePath) {
        const markdownSource = slateNodesToMarkdownSource(currentDocumentRef.current.slateNodes)
        updateSourceContent(markdownSource)
        window.api.saveFile(currentDocumentRef.current.filePath, markdownSource);
        console.log('saved markdownSource: ', markdownSource)
      } else {
        throw new Error('filePath is empty.')
      }
    }
    catch (error) {
      console.error('failed to save file: ', error)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'a' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      // If the cursor is inside the code block, cmd+a only select the code block.
      const [codeBlockEntries] = Array.from(
        Editor.nodes(editor, {
          match: n => SlateElement.isElement(n) && n.type === 'code',
          universal: true,
        }))
      if (codeBlockEntries) {
        const [node, path] = codeBlockEntries;
        Transforms.select(editor, path);
      } else {
        // If the cursor is not inside the code block, cmd+a select all the content.
        const [start, end] = Editor.edges(editor, [])
        Transforms.select(editor, {
          anchor: start,
          focus: end,
        })
      }
    }
  }

  const ShowSlateNodes = () => {
    console.log('slateNodes: ', currentDocument.slateNodes)
  }

  useEffect(() => {
    // Add a listener to receive the 'save-file' event from main process.
    window.ipcRenderer.on('save-file', onSave)

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeListener('save-file', onSave)
    }
  }, [])

  useEffect(() => {
    try {
      if (currentDocument.sourceContent) {
        let slateNodes = markdownSourceToSlateNodes(currentDocument.sourceContent)
        if (slateNodes.length === 0) {
          slateNodes = DefaultEmptySlateNodes;
        }
        console.log('init slateNodes: ', slateNodes)
        // Using Transforms to clean up the slate content first, then insert the new content. Because setSlateContent is not working for slate.
        SlateEditorUtils.resetSlateNodes(editor, slateNodes);
        updateSlateNodes(slateNodes)
        currentDocumentRef.current.slateNodes = slateNodes;
      } else {
        SlateEditorUtils.resetSlateNodes(editor);
        updateSlateNodes(DefaultEmptySlateNodes)
        currentDocumentRef.current.slateNodes = DefaultEmptySlateNodes;
      }
    } catch (error) {
      console.error('error: ', error)
    }
  }, [currentDocument.sourceContent])

  const renderElement = useCallback((props: RenderElementProps) => <RenderElement {...props} />, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => <RenderLeaf {...props} />, [])

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] mb-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent' onClick={handleDivClick}>
          <button onClick={onLogMarkdownSource}>Log Markdown Source</button>
          <button onClick={onSave}>Save</button>
          <button onClick={onMarkdownSource}>To Markdown</button>
          <button onClick={ShowSlateNodes}>Show Slate Nodes</button>
          <Slate editor={editor} initialValue={currentDocument.slateNodes} onChange={onChange}>
            <div ref={editorRef}>
              {/* decorate: to highlight code block */}
              {/* Example: https://github.com/ianstormtaylor/slate/blob/8f2ad02db32f348eb9499e8db1e46d1b705d4d5d/site/examples/code-highlighting.tsx */}
              <SetNodeToDecorations />
              <Editable
                decorate={decorate}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                onKeyDown={onKeyDown}
                style={{ border: 'none', boxShadow: 'none', outline: 'none' }} />
            </div>
          </Slate>
        </div>
      </div>
    </div>
  )
}

export default ContentEditor