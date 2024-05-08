import { ReactEditor, withReact } from 'slate-react'
import { HistoryEditor, withHistory } from 'slate-history'
import { BaseEditor, createEditor } from 'slate'
import { withMarkdownShortcuts } from "../components/editor/slate/plugin/WithMarkdownShortcuts";
import { withImages } from "../components/editor/slate/plugin/withImages";
import { markdownSourceToMEditorNodes } from '../components/editor/slate/parser/ParseMarkdownSourceToSlateNodes';
import { createContext, useContext } from 'react';
import { nanoid } from 'nanoid'

export const EditorContext = createContext<MEditor | undefined>(undefined)
export const useMEditor = () => {
  const editor = useContext(EditorContext);
  if (!editor) {
    throw new Error('No MEditor available in context');
  }
  return editor;
}

export class MEditor {
  // Rich text editor: Slate, wiki: https://docs.slatejs.org/walkthroughs/02-adding-event-handlers
  // withMarkdownShortcuts: is a custom plugin to modify the editor's behavior.
  // withImages: is a custom plugin to handle image insertion.
  // withHistory: to add undo/redo history to the editor.
  editor: BaseEditor & ReactEditor & HistoryEditor & { nodeToDecorations?: Map<any, any> };

  rootDir: string | undefined;
  filePath: string | undefined;
  sourceContent: string;
  slateNodes: any[];
  changed: boolean = false;
  // This id is used to identify the tab in the tabs array, and the key for tab components.
  // It must have for remove tab scenarios, otherwise, the tab content could be redenred unexpectedly.
  id: string;

  constructor(rootDir: string | undefined, filePath: string | undefined = undefined, sourceContent: string = '', slateNodes: any[] = []) {
    this.rootDir = rootDir;
    this.filePath = filePath;
    this.sourceContent = sourceContent;
    this.editor = withImages(withMarkdownShortcuts(withReact(withHistory(createEditor()))), rootDir, filePath);

    // 1. For a new empty document: filePath=undefined, sourceContent='', slateNodes=[].
    // 2. For a opened document: filePath != undefined
    //   - if it's a new opened doc: slateNodes=[]. -> need to parse sourceContent to slateNodes.
    //   - if it's a editing doc: slateNodes=[...].
    this.id = nanoid();
    this.filePath = filePath;
    this.sourceContent = sourceContent;
    this.slateNodes = slateNodes && slateNodes.length > 0 ? slateNodes : markdownSourceToMEditorNodes(sourceContent);
  }
}
