import { Dispatch, SetStateAction, useState } from 'react'
import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import { CloseIcon } from '../icons';
import { Button, Box, DialogContentText, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { toast } from 'react-hot-toast';
import { slateNodesToMarkdownSource } from '../editor/slate/parser/ParseSlateNodesToMarkdownSource';

interface TabButtonProps {
  title: string;
  tabIndex: number;
  tabId: string;
};

const ConfirmModal = ({ showModal, setShowModal, tabIndex }: { showModal: boolean, setShowModal: Dispatch<SetStateAction<boolean>>, tabIndex: number }) => {
  const tabs = useStore((state) => state.tabs);
  const removeTabByIndex = useStore((state) => state.removeTabByIndex);
  const updateSourceContent = useStore((state) => state.updateSourceContent);

  const onRemoveTab = () => {
    removeTabByIndex(tabIndex)
    setShowModal(false)
  }

  const onSaveAndClose = () => {
    console.log('save and close: tabIndex=', tabIndex, ' filePath=', tabs[tabIndex].filePath)
    try {
      if (tabs[tabIndex].filePath) {
        const markdownSource = slateNodesToMarkdownSource(tabs[tabIndex].slateNodes)
        if (!markdownSource) {
          throw new Error('markdownSource is undefined.')
        }
        updateSourceContent(markdownSource)
        window.api.saveFile(tabs[tabIndex].filePath, markdownSource).then(() => {
          removeTabByIndex(tabIndex)
        })
      } else {
        throw new Error('filePath is empty.')
      }
    }
    catch (error) {
      console.error('failed to save file: ', error)
      toast.error(`Failed to save file ${tabs[tabIndex].filePath}. ${error}`);
    } finally {
      setShowModal(false)
    }
  }

  return (
    <Dialog open={showModal} onClose={setShowModal} fullWidth>
      <DialogTitle>{'Confirm'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This file hasn't been saved yet. Do you want to save it before closing?
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        {/* justify-end: push the buttons to the right */}
        <Box className="flex justify-end mr-4 -mt-4" width="100%">
          <Button onClick={onRemoveTab} >Don't Save</Button>
          <Button onClick={onSaveAndClose}>Save</Button>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

const TabButton = ({
  title,
  tabIndex,
  tabId,
}: TabButtonProps) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const activeTabId = useStore((state) => state.activeTabId);
  const tabs = useStore((state) => state.tabs);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const removeTabByIndex = useStore((state) => state.removeTabByIndex);

  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  const onClickTab = () => {
    setActiveTabId(tabId)
    setShowSearch(false)
  }

  const onCloseTab = () => {
    if (tabs[tabIndex].changed) {
      setShowConfirmModal(true)
    } else {
      removeTabByIndex(tabIndex)
    }
  }

  return (
    <>
      {/* relative: to make the close button be absolute to the parent */}
      <div className={'relative z-10 flex flex-row w-full items-center select-none'}>
        <div
          onClick={onClickTab}
          className={`flex w-full h-8 justify-center items-center rounded-none border-r border-gray-200/80 ${activeTabId == tabId ? 'bg-white' : 'bg-gray-50'}`}>
          <span>{title} {tabs[tabIndex].changed && '*'}</span>
        </div>

        {/* Close tab button */}
        <div className='flex absolute right-1'>
          <button
            onClick={onCloseTab}
            className={`rounded-md p-[2px] mx-[0.5] my-2 text-neutral-400 focus:outline-none border-none dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 ${activeTabId == tabId ? 'bg-white' : 'bg-gray-50'}`}>
            <CloseIcon className='w-5 h-5' />
          </button>
        </div>
      </div>

      {showConfirmModal && <ConfirmModal showModal={showConfirmModal} setShowModal={setShowConfirmModal} tabIndex={tabIndex} />}
    </>
  )
}

const getFileName = (filePath: string | undefined) => {
  if (filePath === undefined) return 'Untitled'

  const parts = filePath.split('/')
  return parts[parts.length - 1]
}

const TabsNav = () => {
  const tabs = useStore((state) => state.tabs);

  return (
    //  if tabs.length > 1, show this tabs nav
    tabs.length > 1 && (
      <div className="flex h-8 justify-center items-center border border-gray-200 bg-gray-50">
        {tabs.map((tab, index) => (
          <TabButton key={tab.id} title={getFileName(tab.filePath)} tabIndex={index} tabId={tab.id} />
        ))}
      </div>
    )
  )
}

export default TabsNav