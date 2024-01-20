import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, RenderLeafProps, useSlateStatic } from 'slate-react'
import { LanguageSelect } from './decorate/SetNodeToDecorations'

export const RenderElement = ({ attributes, children, element }: RenderElementProps) => {
  const editor = useSlateStatic()

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
        const setLanguage = (language: string) => {
          const path = ReactEditor.findPath(editor, element)
          Transforms.setNodes(editor, { language }, { at: path })
        }
        return (
          <div className="MarkMateCodeBlocks" style={{ position: 'relative' }} {...attributes}>
            {/* caretColor: to set the cursor color */}
            <pre spellCheck={false} style={{ padding: '20px', overflowX: 'auto', borderRadius: '5px', backgroundColor: '#2e3440ff', caretColor: '#5a9ff4', color: 'white' }} {...attributes}>
              {children}
            </pre>
            <LanguageSelect
              value={element.language || 'text'}
              onChange={e => setLanguage(e.target.value)}
            />
          </div>
        );
      case 'code-line':
        return <div {...attributes}>{children}</div>;
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

  const style = props.leaf.color ? { color: props.leaf.color } : undefined;
  return <span {...props.attributes} style={style}>{children}</span>
}