import { useState } from 'react'
import MarkdownSourceEditor from './markdown-source-editor/MarkdownSourceEditor';
import SlateEditor from './slate/SlateEditor';
import { EditorContext, MEditor } from '../../models/MEditor';

interface EditorPanelProps {
  tabIndex: number;
  tab: MEditor;
};

export const EditorPanel = ({ tabIndex, tab }: EditorPanelProps) => {
  const [showMarkdownSourceEditor, setShowMarkdownSourceEditor] = useState<boolean>(true);

  return (
    // EditorContext.Provider is used to pass the MEditor object to the children components.
    // Let the children components to access the MEditor object by using useMEditor() hook.
    <EditorContext.Provider value={tab}>
      <div className="flex w-full h-full overflow-x-hidden">
        {showMarkdownSourceEditor && (
          <div className="flex w-1/2 h-full">
            <MarkdownSourceEditor />
            <div className="border-r-2 border-gray-200"></div>
          </div>
        )}

        <SlateEditor tabIndex={tabIndex} />

      </div>
    </EditorContext.Provider>
  )
}
