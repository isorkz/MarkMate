import StyledMarkdown from './StyledMarkdown';

interface ContentEditorProps {
  mdSourceContent: string;
}

const StyledMarkdownPreview = ({
  mdSourceContent,
}: ContentEditorProps) => {
  return (
    // using 'break-all' to break the long words
    <div className="flex h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full px-[10%] py-[5%] mb-[5%] overflow-x-auto">
        <div className='w-full break-all MarkMateContent'>
          {/* <CodeMirror value={mdSourceContent} extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]} onChange={setMdSourceContent} /> */}
          <StyledMarkdown>{mdSourceContent}</StyledMarkdown>
        </div>
      </div>
    </div>
  )
}

export default StyledMarkdownPreview