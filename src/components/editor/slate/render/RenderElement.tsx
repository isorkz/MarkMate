import { Descendant, Transforms, Editor, Node } from 'slate'
import { ReactEditor, RenderElementProps, RenderLeafProps, useSlateStatic } from 'slate-react'
import { LanguageSelect, LanguageSelectMap } from '../decorate/SetNodeToDecorations'
import { Image } from '../elements/Image'

const getLanguage = (lang: string | undefined) => {
  if (lang === undefined) return 'text'
  return LanguageSelectMap[lang] || 'text'
}

const setLanguage = (editor: Editor, element: Descendant, language: string) => {
  const path = ReactEditor.findPath(editor, element)
  Transforms.setNodes(editor, { language }, { at: path })
}

const setChecked = (editor: Editor, element: Descendant, checked: boolean) => {
  const path = ReactEditor.findPath(editor, element)
  Transforms.setNodes(editor, { checked }, { at: path })
  for (const [node, nodePath] of Node.texts(element)) {
    const absolutePath = [...path, ...nodePath]
    Transforms.setNodes(editor, { delete: checked }, { at: absolutePath })
  }
}

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
        if (element.order) return <ol start={element.start} {...attributes}>{children}</ol>
        else return <ul {...attributes}>{children}</ul>
      case 'list-item':
        if (element.checked === undefined || element.checked === null) return <li {...attributes}>{children}</li>
        return <li {...attributes} className='check-list-item relative'>
          <input type="checkbox" className='absolute top-[6px] select-none' checked={element.checked} onChange={() => setChecked(editor, element, !element.checked)} />
          {children}
        </li>
      case 'image':
        return <Image attributes={attributes} children={children} element={element} />
      case 'code':
        return (
          <div className="MarkMateCodeBlocks" style={{ position: 'relative' }} {...attributes}>
            {/* caretColor: to set the cursor color */}
            {/* <pre spellCheck={false} style={{ padding: '20px', overflowX: 'auto', borderRadius: '5px', backgroundColor: '#2e3440ff', caretColor: '#5a9ff4', color: 'white' }} {...attributes}> */}
            <pre spellCheck={false}  {...attributes}>
              {children}
            </pre>
            <LanguageSelect
              value={getLanguage(element.language)}
              onChange={e => setLanguage(editor, element, e.target.value)}
            />
          </div>
        );
      case 'code-line':
        return <div {...attributes}>{children}</div>;
      case 'blockquote':
        return <blockquote {...attributes}>{children}</blockquote>
      case 'hr':
        return (
          <div className='border-t border-gray-300 my-5 select-none' contentEditable={false} {...attributes}>
            <span className='hidden'>{children}</span>
          </div>
        );
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
  try {
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
      children = <del className='opacity-50'>{children}</del>
    }
    if (props.leaf.isInlineCode) {
      children = <code>{children}</code>
    }
    if (props.leaf.highlight) {
      if (props.leaf.isCurrentHighlight) {
        children = <mark style={{ backgroundColor: 'orange' }}>{children}</mark>
      } else {
        children = <mark>{children}</mark>
      }
    }

    const style = props.leaf.color ? { color: props.leaf.color } : undefined;
    return <span {...props.attributes} style={style}>{children}</span>
  }
  catch (err) {
    console.error('Failed to render leaf:', props, err)
  }
}