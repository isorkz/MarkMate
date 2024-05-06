import { useCallback, useEffect, useRef } from 'react'
import { Descendant, Transforms, Element as SlateElement } from 'slate'
import { Editor } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, ReactEditor } from 'slate-react'
import useStore from '../../../store/MStore'
import { RenderElement, RenderLeaf } from '../slate/render/RenderElement'
import { slateNodesToMarkdownSource } from '../slate/parser/ParseSlateNodesToMarkdownSource'
import { SetNodeToDecorations, useDecorate } from '../slate/decorate/SetNodeToDecorations'
import { useMEditor } from '../../../models/MEditor'

interface SlateEditorProps {
  tabIndex: number;
};

const SlateEditor = ({ tabIndex }: SlateEditorProps) => {
  const activeEditor = useMEditor()

  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const updateSlateNodes = useStore((state) => state.updateSlateNodes);
  const saveTab = useStore((state) => state.saveTab);

  const htmlDivSlateEitorRef = useRef<HTMLDivElement>(null);

  // useRef: to get the current value of a variable, and it will not cause a re-render.
  // Otherwise, in onSave() triggered by the 'save-file' event, all values are the same as the initial values, they are not updated.
  const activeTabIndexRef = useRef(activeTabIndex);
  const activeEditorRef = useRef(activeEditor);

  useEffect(() => {
    activeTabIndexRef.current = activeTabIndex;
  }, [activeTabIndex]);

  useEffect(() => {
    activeEditorRef.current = activeEditor;
  }, [activeEditor]);

  // use the custom decorate function to highlight the code block and search results.
  const decorate = useDecorate(activeEditor.editor)

  const onChange = (value: Descendant[]) => {
    // Only select, do nothing.
    if (activeEditor.editor.operations.length === 0 || (activeEditor.editor.operations.length === 1 && activeEditor.editor.operations[0].type === 'set_selection')) {
      return;
    }
    updateSlateNodes(value)
    const markdownSource = slateNodesToMarkdownSource(activeEditor.slateNodes)
    updateSourceContent(markdownSource)
  }

  const handleDivClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Check if the click target is the editor or a child of the editor
    if (htmlDivSlateEitorRef.current && (htmlDivSlateEitorRef.current === event.target || htmlDivSlateEitorRef.current.contains(event.target as Node))) {
      return;
    }

    // Focus the editor
    ReactEditor.focus(activeEditor.editor);

    // Move the cursor to the end of the document
    const end = Editor.end(activeEditor.editor, []);
    Transforms.setSelection(activeEditor.editor, { anchor: end, focus: end });
  }

  const onMarkdownSource = () => {
    const markdownSource = slateNodesToMarkdownSource(activeEditor.slateNodes)
    updateSourceContent(markdownSource)
  }

  const onLogMarkdownSource = () => {
    console.log('slateNodes: ', activeEditor.slateNodes)
    const markdownSource = slateNodesToMarkdownSource(activeEditor.slateNodes)
    console.log('markdownSource: ', markdownSource)
  }

  const onSave = () => {
    // For the 'save-file' event triggered by global shortcut, needs to use the ref to get the current value.
    if (tabIndex !== activeTabIndexRef.current) {
      return;
    }

    try {
      if (activeEditorRef.current.filePath) {
        const markdownSource = slateNodesToMarkdownSource(activeEditorRef.current.slateNodes)
        updateSourceContent(markdownSource)
        window.api.saveFile(activeEditorRef.current.filePath, markdownSource).then(() => {
          saveTab();
          console.log('saved markdownSource: ', markdownSource)
        })
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
        Editor.nodes(activeEditor.editor, {
          match: n => SlateElement.isElement(n) && n.type === 'code',
          universal: true,
        }))
      if (codeBlockEntries) {
        const [node, path] = codeBlockEntries;
        Transforms.select(activeEditor.editor, path);
      } else {
        // If the cursor is not inside the code block, cmd+a select all the content.
        const [start, end] = Editor.edges(activeEditor.editor, [])
        Transforms.select(activeEditor.editor, {
          anchor: start,
          focus: end,
        })
      }
    }
  }

  const ShowSlateNodes = () => {
    console.log('slateNodes: ', activeEditor.slateNodes)
  }

  useEffect(() => {
    // Add a listener to receive the 'save-file' event from main process.
    window.ipcRenderer.on('save-file', onSave)
    console.log("register onSave listener activeTabIndex=", activeTabIndex)

    // Specify how to clean up after this effect
    return () => {
      window.ipcRenderer.removeListener('save-file', onSave)
      console.log("remove onSave listener activeTabIndex=", activeTabIndex)
    }
  }, [])

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
          <Slate editor={activeEditor.editor} initialValue={activeEditor.slateNodes} onChange={onChange}>
            <div ref={htmlDivSlateEitorRef}>
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

export default SlateEditor
