import { ReactEditor, RenderElementProps, useFocused, useSelected, useSlateStatic } from 'slate-react'
import { isValidUrl } from '../../../../utils/utils'
import useStore from '../../../../store/MStore'
import { ImageElement } from '../Element'

export const Image = ({ attributes, children, element }: RenderElementProps) => {
  const editor = useSlateStatic()
  // const path = ReactEditor.findPath(editor, element)

  const selected = useSelected()
  const focused = useFocused()

  element = element as ImageElement
  let url = element.url
  if (url && !isValidUrl(url)) {
    // If it's local file, get the file url: file:///path/to/file
    const currentDocument = useStore((state) => state.currentDocument);
    url = window.api.getFileUrl(currentDocument.filePath, url)
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
