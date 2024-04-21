import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import useStore from '../../../store/MStore'
import { useMEditor } from '../../../models/MEditor';
import { markdownSourceToMEditorNodes } from '../slate/parser/ParseMarkdownSourceToSlateNodes';
import { SlateEditorUtils } from '../slate/SlateEditorUtils';

const MarkdownSourceEditor = () => {
  const activeEditor = useMEditor();
  const updateSourceContent = useStore((state) => state.updateSourceContent);
  const updateSlateNodes = useStore((state) => state.updateSlateNodes);

  const onChange = (value: string, viewUpdate: ViewUpdate) => {
    updateSourceContent(value)

    const slateNodes = markdownSourceToMEditorNodes(value)
    SlateEditorUtils.resetSlateNodes(activeEditor.editor, slateNodes);
    updateSlateNodes(slateNodes)
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