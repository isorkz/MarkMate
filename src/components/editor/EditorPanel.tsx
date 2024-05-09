import MarkdownSourceEditor from './markdown-source-editor/MarkdownSourceEditor';
import SlateEditor from './slate/SlateEditor';
import { EditorContext, MEditor } from '../../models/MEditor';
import TocView from './toc/TocView';
import { Divider } from '@mui/material';
import useStore from '../../store/MStore';

interface EditorPanelProps {
  tabIndex: number;
  tab: MEditor;
};

export const EditorPanel = ({ tabIndex, tab }: EditorPanelProps) => {
  const showTocPanel = useStore((state) => state.showTocPanel);
  const showMarkdownSourceEditor = useStore((state) => state.showMarkdownSourceEditor);

  return (
    // EditorContext.Provider is used to pass the MEditor object to the children components.
    // Let the children components to access the MEditor object by using useMEditor() hook.
    <EditorContext.Provider value={tab}>
      <div className="flex w-full h-full overflow-x-hidden">
        {showMarkdownSourceEditor && (
          // 18rem: is the width of TOC view
          <div className='flex flex-none h-full' style={{ width: showTocPanel ? 'calc((100% - 18rem)/2)' : '50%' }}>
            <MarkdownSourceEditor />
            <Divider orientation="vertical" flexItem />
          </div>
        )}

        <SlateEditor tabIndex={tabIndex} tabId={tab.id} />

        <TocView tabIndex={tabIndex} tabId={tab.id} />
      </div>
    </EditorContext.Provider>
  )
}
