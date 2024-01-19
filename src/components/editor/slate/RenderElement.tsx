import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Highlight, themes } from "prism-react-renderer"

export const RenderElement = ({ attributes, children, element }: RenderElementProps) => {
  try {
    switch (element.type) {
      case 'paragraph':
        return <p {...attributes}>{children}</p>
      case 'head':
        const Head = `h${element.level}`;
        return <Head {...attributes}>{children}</Head>
      case 'list':
        if (element.order) return <ol {...attributes}>{children}</ol>
        else return <ul {...attributes}>{children}</ul>
      case 'list-item':
        if (element.checked === undefined || element.checked === null) return <li {...attributes}>{children}</li>
        return element.checked ? (
          <li {...attributes}>
            <div {...attributes}>
              <input type="checkbox" checked />
              {children}
            </div>
          </li>
        ) : (
          <li {...attributes}>
            <div {...attributes}>
              <input type="checkbox" />
              {children}
            </div>
          </li>)
      case 'image':
        return <img src={element.url}></img>
      case 'code':
        let language = element.language || 'text'
        if (element.language === 'c++') {
          language = 'cpp'
        }
        let codeBlock = element.children.map((item: any) => item.children[0]?.text).join('\n');
        return (
          <div style={{ position: 'relative' }} {...attributes}>
            <Highlight theme={themes.vsDark} code={codeBlock} language={language}>
              {({ className, style, tokens, getLineProps }) => (
                // className = { "MarkMateCodeBlocks"}
                <pre className={className} style={{ ...style, padding: '20px', overflowX: 'auto', borderRadius: '5px' }} {...attributes}>
                  {tokens.map((line, i) => (
                    <div {...getLineProps({ line, key: i })}>
                      {children[i]}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
            {/* show the language name on the top right corner. */}
            <div style={{
              position: 'absolute',
              top: '0',
              right: '0',
              padding: '5px',
              color: '#aaa',
              fontSize: '12px',
            }}>
              {language}
            </div>
          </div >
        );
      case 'code-line':
        return <span {...attributes}>{children}</span>;
      case 'blockquote':
        return <blockquote {...attributes}>{children}</blockquote>
      case 'hr':
        return <hr />
      case 'table':
        const head = children[0];  // set the first row as table head
        const body = children.slice(1); // set the rest rows as table body
        return (
          <table {...attributes}>
            <thead>{head}</thead>
            <tbody>{body}</tbody>
          </table>
        );
      case 'table-row':
        return <tr {...attributes}>{children}</tr>
      case 'table-cell':
        if (element.isFirstRow) return <th style={{ textAlign: element.align ? element.align : 'left' }} {...attributes}>{children}</th>
        else return <td style={{ textAlign: element.align }} {...attributes}>{children}</td>
      default:
        return <div {...attributes}>{children}</div>
    }
  }
  catch (err) {
    console.error('Failed to render slate element:', element, err)
  }
}

export const RenderLeaf = (props: RenderLeafProps) => {
  let children = <>{props.children}</>
  if (props.leaf.url) {
    children = <a href={props.leaf.url} className='underline'>{children}</a>
  }
  if (props.leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (props.leaf.emphasis) {
    children = <em>{children}</em>
  }
  if (props.leaf.delete) {
    children = <del>{children}</del>
  }
  if (props.leaf.isInlineCode) {
    children = <code>{children}</code>
  }
  return <span {...props.attributes}>{children}</span>
}