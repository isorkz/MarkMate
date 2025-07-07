import { Editor } from '@tiptap/react'
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
}