import { Editor, Transforms, Descendant } from 'slate'

export class SlateEditorUtils {
  static resetSlateNodes = (editor: Editor, slateNodes?: Descendant[]) => {
    if (editor.children.length > 0) {
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
      Transforms.delete(editor, { at: [0] })
    }

    if (slateNodes) {
      Transforms.insertNodes(editor, slateNodes, { at: [0] })
    } else {
      Transforms.insertNodes(editor, [
        {
          type: 'paragraph',
          children: [{ text: '' }],
        }
      ], { at: [0] })
    }
  }
}