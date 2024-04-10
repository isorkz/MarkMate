import { Editor, Transforms, Element as SlateElement, Range } from 'slate'
import { ReactEditor } from 'slate-react';
import { ImageElement } from '../Element';

export const withImages = (editor: ReactEditor, dirPath: string | undefined, currentFilePath: string | undefined) => {
  const { insertData, isVoid } = editor

  editor.isVoid = element => {
    return element.type === 'image' ? true : isVoid(element)
  }

  // Insert data from a DataTransfer into the editor.
  // This is a proxy method to call in this order insertFragmentData(editor: ReactEditor, data: DataTransfer) and then insertTextData(editor: ReactEditor, data: DataTransfer).
  // Wiki: https://docs.slatejs.org/libraries/slate-react/react-editor#datatransfer-methods
  editor.insertData = data => {
    const text = data.getData('text/plain')
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
            if (url && dirPath && currentFilePath) {
              // window.api defined in preload.ts, and implemented in ipcHandler.ts
              console.log('[insertData] dirPath: ', dirPath)
              console.log('[insertData] currentFilePath: ', currentFilePath)
              window.api.saveImageFile(dirPath, currentFilePath, url).then((imageFile: any) => {
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
    //  else if (isImageUrl(text)) {
    //   insertImage(editor, text)
    //   return
    // }

    // Use the default insertData method for other types of data.
    insertData(data)
  }

  return editor
}

const insertImage = (editor: ReactEditor, url: string) => {
  const image: ImageElement = { type: 'image', url: url, children: [{ text: '' }] }
  Transforms.insertNodes(editor, image)
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  })
}