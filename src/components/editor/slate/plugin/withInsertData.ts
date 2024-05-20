import { Editor, Transforms, Element as SlateElement } from 'slate'
import { CustomText, ImageElement } from '../Element';
import { isValidUrl } from '../../../../utils/common';

// TODO: handle if rootDir / currentFilePath is undefined
export const withInsertData = (editor: Editor, rootDir: string | undefined, currentFilePath: string | undefined) => {
  const { insertData, isVoid } = editor

  editor.isVoid = element => {
    return element.type === 'image' ? true : isVoid(element)
  }

  // Insert data from a DataTransfer into the editor.
  // This is a proxy method to call in this order insertFragmentData(editor: ReactEditor, data: DataTransfer) and then insertTextData(editor: ReactEditor, data: DataTransfer).
  // Wiki: https://docs.slatejs.org/libraries/slate-react/react-editor#datatransfer-methods
  editor.insertData = data => {
    let text = data.getData('text/plain')
    const { files } = data

    console.log('[insertData] data: ', data)
    console.log('[insertData] text: ', text)

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split('/')

        console.log('[insertData] mime: ', mime)
        if (mime === 'image') {
          // Add an event listener to listen for the load event, which is fired when the file has been read.
          reader.addEventListener('load', () => {
            const url = reader.result
            console.log('[insertData] url: ', url)
            if (url && rootDir && currentFilePath) {
              // window.api defined in preload.ts, and implemented in ipcHandler.ts
              console.log('[insertData] rootDir: ', rootDir)
              console.log('[insertData] currentFilePath: ', currentFilePath)
              window.api.saveImageFile(rootDir, currentFilePath, url).then((imageFile: any) => {
                console.log('[insertData] saved image file: ', imageFile)
                insertImage(editor, imageFile)
              }).catch((err: any) => {
                console.error('[insertData] failed to save image file: ', err)
              })
            }
          })

          reader.readAsDataURL(file)
          return
        }
      }
    }

    // Only insert the text in code block. Because the default insertData method will add extra code block format.
    if (editor.selection) {
      const [match] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && n.type === 'code',
      })
      if (match) {
        // For text copied from code block, remove the extra new line.
        text = text.replace(/\n\n/g, '\n')
        Transforms.insertFragment(editor, text.split('\n').map(lineText => {
          return { type: 'code-line', children: [{ text: lineText }] }
        }))
        return
      }
    }

    // If the text is a URL, insert a link instead of plain text.
    if (isValidUrl(text)) {
      const linkFragment: CustomText[] = [
        {
          text: text,
          url: text,
        }
      ]
      Editor.insertFragment(editor, linkFragment)
      return
    }

    //  else if (isImageUrl(text)) {
    //   insertImage(editor, text)
    //   return
    // }

    // Use the default insertData method for other types of data.
    insertData(data)
  }

  return editor
}

const insertImage = (editor: Editor, url: string) => {
  const image: ImageElement = { type: 'image', url: url, children: [{ text: '' }] }
  Transforms.insertNodes(editor, image)
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  })
}