import { Editor, Transforms, Element as SlateElement } from 'slate'
import { DefaultParagraphElement, ImageElement } from '../Element';

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
    console.log('[insertData] data: ', data)

    // If only insert image
    const { files } = data
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

    let html = data.getData('text/html')
    console.log('[insertData] html: ', html)
    // If the html is not pasted from slate editor, parse it to slate nodes.
    // Otherwise, use the default insertData method.
    if (html && !html.includes('data-slate-')) {
      const slateNodes = parseHtml(html)
      Transforms.insertFragment(editor, slateNodes);
      return
    }

    // Only insert the text in code block. Because the default insertData method will add extra code block format.
    if (editor.selection) {
      const [match] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && n.type === 'code',
      })
      if (match) {
        let text = data.getData('text/plain')
        console.log('[insertData] text: ', text)
        // For text copied from code block, remove the extra new line.
        text = text.replace(/\n\n/g, '\n')
        Transforms.insertFragment(editor, text.split('\n').map(lineText => {
          return { type: 'code-line', children: [{ text: lineText }] }
        }))
        return
      }
    }

    // Use the default insertData method for other types of data.
    insertData(data)
  }

  return editor
}

const insertImage = (editor: Editor, url: string) => {
  const image: ImageElement = { type: 'image', url: url, children: [{ text: '' }] }
  // Always wrap the image with a paragraph element, because parseMarkdownSourceToSlateNodes will always wrap the image with a paragraph element.
  Transforms.insertNodes(editor, { type: 'paragraph', children: [image] })
  Transforms.insertNodes(editor, DefaultParagraphElement())
}

const parseHtml = (html: string) => {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');

  const traverse = (node: Node): any => {
    // console.log('traverse node:', node)
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      // Filter out text nodes that only contain whitespace
      if (text.trim() === '') {
        return null;
      }
      return { text };
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    const element = node as HTMLElement;
    let children: any[] = [];
    element.childNodes.forEach(child => {
      const childNode = traverse(child);
      if (childNode) {
        if (childNode.text !== undefined || childNode.type === 'image') {
          children.push(childNode);
        } else {
          children = children.concat(childNode.children || []);
        }
      }
    });
    // console.log('element: ', element)
    // console.log('element.tagName: ', element.tagName)
    switch (element.tagName.toLowerCase()) {
      case 'p':
        return { type: 'paragraph', children };
      case 'strong':
      case 'b':
        return { text: children.map((c) => c.text).join(''), bold: true };
      case 'em':
      case 'i':
        return { text: children.map((c) => c.text).join(''), italic: true };
      case 'a':
        return {
          text: children.map((c) => c.text).join(''),
          url: element.getAttribute('href') || ''
        };
      case 'img':
        return { type: 'image', url: element.getAttribute('src') || '', children: [{ text: '' }] };
      case 'span':
        return { text: node.textContent || '' }
      case 'h1':
        return { type: 'head', children: [{ text: node.textContent || '' }], level: 1 };
      case 'h2':
        return { type: 'head', children: [{ text: node.textContent || '' }], level: 2 };
      case 'h3':
        return { type: 'head', children: [{ text: node.textContent || '' }], level: 3 };
      case 'h4':
        return { type: 'head', children: [{ text: node.textContent || '' }], level: 4 };
      // handle other elements
      default:
        return { children };
    }
  };

  const slateNodes = Array.from(doc.body.childNodes)
    .map(traverse)
    .filter(node => node !== null);

  console.log('slateNodes: ', slateNodes)
  return slateNodes;
}