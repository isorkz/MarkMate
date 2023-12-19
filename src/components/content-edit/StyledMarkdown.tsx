import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown, { Components } from 'react-markdown';

const StyledMarkdown: React.FC<{ children: string }> = ({ children }) => {
  const components: Components = {
    // using react-syntax-highlighter to highlight code blocks
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      // set the code block's style to the 'vscDarkPlus/coldarkDark' theme.
      // wrapLongLines: to wrap long lines.
      return match
        ? <SyntaxHighlighter
          // wrapLongLines={true}
          // wrapLines={true}
          // lineProps={{ style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word' } }}
          style={vscDarkPlus}
          // showLineNumbers={true}, now it has bugs.
          language={match[1]}
          customStyle={{
            overflowX: 'auto',
            minWidth: '100px',
            maxWidth: '600px',
            // width: '300px',
          }}
          children={String(children).replace(/\n$/, '')} {...props} />
        : <code className={className} {...props}>{children}</code>
    }
  }

  return (
    // using ReactMarkdown to parse markdown content
    // using 'break-all' to break the long words
    <div className='w-full break-all'>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
};

export default StyledMarkdown;