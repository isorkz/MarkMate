import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import useStore from '../../../store/MStore'

const MarkdownSourceEditor = () => {
  const currentDocument = useStore((state) => state.currentDocument);
  const updateSourceContent = useStore((state) => state.updateSourceContent);

  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] mb-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          <CodeMirror value={currentDocument.sourceContent} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={updateSourceContent} />
        </div>
      </div>
    </div>
  )
}

export default MarkdownSourceEditor