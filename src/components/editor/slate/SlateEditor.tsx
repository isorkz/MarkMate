import { useCallback, useRef } from 'react'
import { Descendant, Transforms, Element as SlateElement, Range } from 'slate'
import { Editor } from 'slate'
import { Slate, RenderElementProps, RenderLeafProps, Editable, ReactEditor } from 'slate-react'
import useStore from '../../../store/MStore'
import { RenderElement, RenderLeaf } from '../slate/render/RenderElement'
import { slateNodesToMarkdownSource } from '../slate/parser/ParseSlateNodesToMarkdownSource'
import { SetNodeToDecorations, useDecorate } from '../slate/decorate/SetNodeToDecorations'
import { useMEditor } from '../../../models/MEditor'
import useTreeStore from '../../../store/TreeStore'
import { toast } from 'react-hot-toast';
import { insertTabForListItem } from './plugin/insertTab'

const SlateEditor = () => {
  const activeEditor = useMEditor()

  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const updateSlateNodes = useStore((state) => state.updateSlateNodes);
  const saveTab = useStore((state) => state.saveTab);
  const showMarkdownSourceEditor = useStore((state) => state.showMarkdownSourceEditor);

  const slateNodesCache = useTreeStore((state) => state.slateNodesCache);
  const fileTree = useTreeStore((state) => state.fileTree);

  const htmlDivSlateEitorRef = useRef<HTMLDivElement>(null);

  // use the custom decorate function to highlight the code block and search results.
  const decorate = useDecorate(activeEditor.editor)

  const onValueChange = (value: Descendant[]) => {
    // Only select, do nothing.
    if (activeEditor.editor.operations.length === 0 || (activeEditor.editor.operations.length === 1 && activeEditor.editor.operations[0].type === 'set_selection')) {
      return;
    }

    updateSlateNodes(value)

    // update the source content
    const markdownSource = slateNodesToMarkdownSource(activeEditor.slateNodes)
    if (!markdownSource) return
    updateSourceContent(markdownSource)

    // update the cache
    if (activeEditor.filePath) {
      slateNodesCache.set(activeEditor.filePath, value)
    }
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

  const onLogFileTree = () => {
    console.log('fileTree: ', fileTree)
  }

  const onLogMarkdownSource = () => {
    console.log('slateNodes: ', activeEditor.slateNodes)
    const markdownSource = slateNodesToMarkdownSource(activeEditor.slateNodes)
    console.log('markdownSource: ', markdownSource)
  }

  const onSave = () => {
    try {
      console.log('save file: ', activeEditor.filePath)
      if (activeEditor.filePath) {
        const markdownSource = slateNodesToMarkdownSource(activeEditor.slateNodes)
        if (!markdownSource) {
          throw new Error('markdownSource is undefined.')
        }
        updateSourceContent(markdownSource)
        window.api.saveFile(activeEditor.filePath, markdownSource).then(() => {
          saveTab();
        })
      } else {
        throw new Error('filePath is empty.')
      }
    }
    catch (error) {
      console.error('failed to save file: ', error)
      toast.error(`Failed to save file ${activeEditor.filePath}. ${error}`);
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
    } else if (event.key === 'Tab') {
      const { selection } = activeEditor.editor
      if (selection) {
        event.preventDefault(); // prevent tab from losing focus of the editable area
        if (Range.isCollapsed(selection)) {
          const [block] = Editor.nodes<any>(activeEditor.editor, {
            match: n => SlateElement.isElement(n) && n.type === 'paragraph',
            mode: 'lowest'
          })
          if (block) {
            const [node, path] = block
            switch (node.type) {
              case 'paragraph':
                const [parentNode, parentPath] = Editor.parent(activeEditor.editor, path)
                if (SlateElement.isElement(parentNode) && parentNode.type === 'list-item') {
                  insertTabForListItem(activeEditor.editor, selection, node, path, parentNode, parentPath)
                  return
                }
                break
            }
          }
          // activeEditor.editor.insertText('\t')
        }
      }
    }
  }

  const ShowSlateNodes = () => {
    console.log('slateNodes: ', activeEditor.slateNodes)
  }

  const renderElement = useCallback((props: RenderElementProps) => <RenderElement {...props} />, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => <RenderLeaf {...props} />, [])

  return (
    // Do not use 'flex' to layout, and let the 'MarkMateContent' div to fill the parent container.
    // using 'break-all' to break the long words
    <div className="w-full overflow-y-auto overflow-x-hidden">
      <div className={`w-full ${showMarkdownSourceEditor ? 'px-[10%]' : 'px-[15%]'}`}>
        <div className='w-full break-all MarkMateContent pt-5 pb-[20%]' onClick={handleDivClick}>
          <button onClick={ShowSlateNodes}>Show Slate Nodes</button>
          <button onClick={onLogMarkdownSource}>Log Markdown Source</button>
          <button onClick={onLogFileTree}>Show File Tree</button>
          <button onClick={onSave}>Save</button>
          {/* use onValueChange instead of onChange */}
          <Slate editor={activeEditor.editor} initialValue={activeEditor.slateNodes} onValueChange={onValueChange}>
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
