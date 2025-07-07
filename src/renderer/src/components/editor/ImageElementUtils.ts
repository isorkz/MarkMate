import { Editor } from '@tiptap/react'
import toast from 'react-hot-toast'
import { isImagePathResolved } from '../../../../shared/commonUtils'

export class ImageElementUtils {
  static IS_SRC_RESOLVED_ATTR = 'is-src-resolved'
  static ORIGINAL_SRC_ATTR = 'original-src'

  // Resolve image paths in the editor DOM only (without affecting markdown source content)
    static resolveAllImageElementsInDom = async (
      editor : Editor,
       workspacePath: string, 
       currentFilePath:string) => {
      // Get all img elements in the editor DOM
      const editorElement = editor.view.dom
      const images = editorElement.querySelectorAll('img')
  
      for (const img of images) {
        await ImageElementUtils.processImageElement(img as HTMLImageElement, workspacePath, currentFilePath)
      }
    }

  static processImageElement = async (
    img: HTMLImageElement,
    workspacePath: string,
    currentFilePath: string
  ): Promise<void> => {
    if (img.hasAttribute(ImageElementUtils.IS_SRC_RESOLVED_ATTR)){
      // Skip if already resolved
      return;
    }

    // Use IS_SRC_RESOLVED_ATTR attribute to mark the image src as processed
    // Store the original src in ORIGINAL_SRC_ATTR attribute
    // Update the src attribute with the absolute file:// URL
    const src = img.getAttribute('src')
    if (src) {
      if (!isImagePathResolved(src)){
        const resolvedSrc = await window.electron.ipcRenderer.invoke(
                'file:get-image-path',
                src,
                workspacePath,
                currentFilePath
              )
        img.setAttribute('src', resolvedSrc)
        img.setAttribute(ImageElementUtils.ORIGINAL_SRC_ATTR, src)
      }
      img.setAttribute(ImageElementUtils.IS_SRC_RESOLVED_ATTR, 'true')
    }
  }

  // Handle paste events to convert pasted images to local files
  static handleImagePaste = async (
    editor: Editor,
    imageItem: DataTransferItem,
    workspacePath: string,
    currentFilePath: string
  ): Promise<void> => {
    const file = imageItem.getAsFile()
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        try {
          // Save image to local file
          const extension = file.type.split('/')[1] || 'png'
          const relativePath = await window.electron.ipcRenderer.invoke(
            'file:save-image',
            e.target.result,
            workspacePath,
            currentFilePath,
            extension
          )

          // Insert image with local file path
          editor.commands.setImage({ src: relativePath })
        } catch (error) {
          console.error('Failed to save pasted image:', error)
          toast.error('Failed to save pasted image')
        }
      }
    }

    reader.onerror = () => {
      console.error('Failed to read pasted image file')
      toast.error('Failed to read pasted image')
    }

    reader.readAsDataURL(file)
  }
}