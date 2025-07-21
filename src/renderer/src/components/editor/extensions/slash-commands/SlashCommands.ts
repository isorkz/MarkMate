import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

// https://v2.tiptap.dev/docs/examples/experiments/slash-commands
//
// TipTap extension that adds slash commands support to the editor
// When user types "/", it triggers a suggestion dropdown with available commands
export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',  // Character that triggers the suggestion
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})