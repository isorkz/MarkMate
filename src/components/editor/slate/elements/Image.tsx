import { ReactEditor, RenderElementProps, useFocused, useSelected, useSlateStatic } from 'slate-react'
import { isValidUrl } from '../../../../utils/common'
import { ImageElement } from '../Element'
import { useMEditor } from '../../../../models/MEditor'

export const Image = ({ attributes, children, element }: RenderElementProps) => {
  // const editor = useSlateStatic()
  // const path = ReactEditor.findPath(editor, element)

  const selected = useSelected()
  const focused = useFocused()

  element = element as ImageElement
  let url = element.url
  if (url && !isValidUrl(url)) {
    // If it's local file, get the file url: file:///path/to/file
    const activeEditor = useMEditor()
    url = window.api.getImageFileUrl(activeEditor.fileNode.path, url)
  }

  return (
    <div {...attributes}>
      {children}
      <div contentEditable={false} className="relative">
        <img src={encodeURI(url)} className={`block border-2 rounded ${selected && focused ? 'border-blue-500/60' : 'border-transparent'}`}></img>
      </div>
    </div>
  )
}
