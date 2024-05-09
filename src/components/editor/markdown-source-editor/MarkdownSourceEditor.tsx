import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import useStore from '../../../store/MStore'
import { useMEditor } from '../../../models/MEditor';
import { markdownSourceToMEditorNodes } from '../slate/parser/ParseMarkdownSourceToSlateNodes';
import useTreeStore from '../../../store/TreeStore';

const MarkdownSourceEditor = () => {
  const activeEditor = useMEditor();

  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const updateSlateNodes = useStore((state) => state.updateSlateNodes);

  const slateNodesCache = useTreeStore((state) => state.slateNodesCache);

  const onChange = (value: string, viewUpdate: ViewUpdate) => {
    updateSourceContent(value)

    // To re-render the slate editor, do not SlateEditorUtils.resetSlateNodes() because it will reset the cursor position two Editor planes.
    // Instead, update activeEditor.editor.children directly.
    const slateNodes = markdownSourceToMEditorNodes(value)
    updateSlateNodes(slateNodes)
    activeEditor.editor.children = slateNodes

    // update the cache
    if (activeEditor.filePath) {
      slateNodesCache.set(activeEditor.filePath, slateNodes)
    }
  }

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] mb-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <CodeMirror value={activeEditor.sourceContent} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={onChange} />
        </div>
      </div>
    </div>
  )
}

export default MarkdownSourceEditor