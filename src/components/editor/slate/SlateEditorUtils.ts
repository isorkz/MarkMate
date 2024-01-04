import { Editor, Transforms } from 'slate'

export class SlateEditorUtils {
  static cleanupSlate = (editor: Editor) => {
    if (editor.children.length > 0) {
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
    }
  }
}