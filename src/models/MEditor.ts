import { ReactEditor, withReact } from 'slate-react'
import { HistoryEditor, withHistory } from 'slate-history'
import { BaseEditor, createEditor } from 'slate'
import { withMarkdownShortcuts } from "../components/editor/slate/plugin/WithMarkdownShortcuts";
import { withInsertData } from "../components/editor/slate/plugin/withInsertData";
import { markdownSourceToMEditorNodes } from '../components/editor/slate/parser/ParseMarkdownSourceToSlateNodes';
import { createContext, useContext } from 'react';
import { DefaultEmptySlateNodes } from '../components/editor/slate/Element';

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
  // withInsertData: is a custom plugin to handle the paste event.
  // withHistory: to add undo/redo history to the editor.
  editor: BaseEditor & ReactEditor & HistoryEditor & { nodeToDecorations?: Map<any, any> };

  rootDir: string | undefined;
  fileId: string | undefined;
  filePath: string | undefined;
  sourceContent: string;
  slateNodes: any[];
  // Whether the content in editor has been changed.
  changed: boolean = false;
  // This id is used to identify the tab in the tabs array, and the key for tab components.
  // It must have for remove tab scenarios, otherwise, the tab content could be rendered unexpectedly.
  // (This id is not the same as fileId, because for new tabs without saving, the fileId is undefined.)
  id: string;

  constructor(id: string, rootDir: string | undefined, fileId: string | undefined = undefined, filePath: string | undefined = undefined, sourceContent: string = '', slateNodes: any[] = []) {
    this.id = id;
    this.rootDir = rootDir;
    this.fileId = fileId;
    this.filePath = filePath;
    this.sourceContent = sourceContent;
    this.editor = withInsertData(withMarkdownShortcuts(withReact(withHistory(createEditor()))), rootDir, filePath);

    // 1. For a new empty document: filePath=undefined, sourceContent='', slateNodes=[].
    // 2. For a opened document: filePath != undefined
    //   - if it's a new opened doc: slateNodes=[]. -> need to parse sourceContent to slateNodes.
    //   - if it's a editing doc: slateNodes=[...].
    let parsedSlateNodes = markdownSourceToMEditorNodes(sourceContent);
    if (!parsedSlateNodes) parsedSlateNodes = DefaultEmptySlateNodes();
    this.slateNodes = slateNodes && slateNodes.length > 0 ? slateNodes : parsedSlateNodes;
  }
}
