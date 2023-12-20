import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm'

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
            // minWidth: '100px',
            // maxWidth: '600px',
            // width: '300px',
          }}
          // 目前没办法区别内联的<code>与不带language的code blocks. 所以这里添加一个新的classname, 以便区分.
          // 然后对于不带language的code blocks, 自己在css中实现样式.
          className={"MarkMateCodeBlocks"}
          children={String(children).replace(/\n$/, '')} {...props} />
        : <code className={className} {...props}>{children}</code>
    }
  }

  return (
    // using ReactMarkdown to parse markdown content
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  );
};

export default StyledMarkdown;