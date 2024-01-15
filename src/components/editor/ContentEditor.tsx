import { useCallback, useMemo, useEffect, useRef } from 'react'
import { Descendant, Transforms, createEditor } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import useStore from '../../store/MStore'
import { RenderElement, RenderLeaf } from './slate/RenderElement'
import { markdownSourceToSlateNodes } from './slate/parser/MarkdownSourceToSlateNodes'
import { slateNodesToMarkdownSource } from './slate/parser/SlateNodesToMarkdownSource'
import { withMarkdownShortcuts } from './slate/parser/ParseMarkdownShortcuts'
import { SlateEditorUtils } from './slate/SlateEditorUtils'
import toast from 'react-hot-toast';

const ContentEditor = () => {
  // Rich text editor: Slate, wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
  // withMarkdownShortcuts: is a custom plugin to modify the editor's behavior.
  // withHistory: to add undo/redo history to the editor.
  const editor = useMemo(() => withMarkdownShortcuts(withReact(withHistory(createEditor()))), [])

  const currentDocument = useStore((state) => state.currentDocument);
  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const updateSlateNodes = useStore((state) => state.updateSlateNodes);

  // useRef: to get the current value of a variable, and it will not cause a re-render.
  // Otherwise, for onSave() triggered by global shortcut, the currentDocumentRef will be the old value.
  const currentDocumentRef = useRef(currentDocument);

  useEffect(() => {
    currentDocumentRef.current = currentDocument;
  }, [currentDocument]);

  const onChange = (value: Descendant[]) => {
    updateSlateNodes(value)
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

  // useCallback: to memoize the function, so that it will not be re-created on every render.
  const onSave = useCallback(() => {
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
  }, [currentDocumentRef])

  const onToast = () => {
    toast.success('This is a success toast message.');
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
        const slateNodes = markdownSourceToSlateNodes(currentDocument.sourceContent)
        console.log('init slateNodes: ', slateNodes)
        // Using Transforms to clean up the slate content first, then insert the new content. Because setSlateContent is not working for slate.
        SlateEditorUtils.cleanupSlate(editor);
        Transforms.insertNodes(editor, slateNodes, { at: [0] })
        updateSlateNodes(slateNodes)
        currentDocumentRef.current.slateNodes = slateNodes;
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
        <div className='w-full break-all MarkMateContent'>
          <button onClick={onLogMarkdownSource}>Log Markdown Source</button>
          <button onClick={onSave}>Save</button>
          <button onClick={onMarkdownSource}>To Markdown</button>
          <button onClick={onToast}>Toast Test</button>
          <Slate editor={editor} initialValue={currentDocument.slateNodes} onChange={onChange}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              style={{ border: 'none', boxShadow: 'none', outline: 'none' }} />
          </Slate>
        </div>
      </div>
    </div>
  )
}

export default ContentEditor