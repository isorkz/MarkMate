import { Dispatch, SetStateAction, useState } from 'react'
import { Button, Box, DialogContentText, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { toast } from 'react-hot-toast';
import useStore from '../../store/MStore';
import useSearchStore from '../../store/SearchStore';
import { CloseIcon } from '../icons';
import { slateNodesToMarkdownSource } from '../editor/slate/parser/ParseSlateNodesToMarkdownSource';
import { getFileName } from '../../utils/common';

interface TabButtonProps {
  title: string;
  tabIndex: number;
  tabId: string;
};

const ConfirmModal = ({ showModal, setShowModal, tabIndex, rootDir }: { showModal: boolean, setShowModal: Dispatch<SetStateAction<boolean>>, tabIndex: number, rootDir: string | undefined }) => {
  const tab = useStore((state) => state.tabs[tabIndex]);
  const removeTabByIndex = useStore((state) => state.removeTabByIndex);
  const updateSourceContent = useStore((state) => state.updateSourceContent);

  const onRemoveTab = () => {
    removeTabByIndex(tabIndex)
    setShowModal(false)
  }

  const onSaveAndClose = () => {
    try {
      if (tab.fileNode.path) {
        const markdownSource = slateNodesToMarkdownSource(tab.slateNodes)
        if (!markdownSource) {
          throw new Error('markdownSource is undefined.')
        }
        updateSourceContent(markdownSource)

        const remoteRepo = import.meta.env.VITE_APP_GIT_REMOTE_REPO;
        window.api.saveFile(tab.fileNode.path, markdownSource, rootDir, remoteRepo).then(() => {
          removeTabByIndex(tabIndex)

          // Sync to the remote repository
          window.api.gitSync(rootDir, remoteRepo).then(() => {
            console.log('git sync success')
          }).catch((error: any) => {
            console.error('git sync error: ', error)
            toast.error('Failed to sync up the remote repository: ', error);
          })
        }).catch((error: any) => {
          console.error('failed to save file: ', error)
          toast.error(`Failed to save file ${tab.fileNode.path}. ${error}`);
        })
      } else {
        throw new Error('filePath is empty.')
      }
    }
    catch (error) {
      console.error('failed to save file: ', error)
      toast.error(`Failed to save file ${tab.fileNode.path}. ${error}`);
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

  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const activeTab = useStore((state) => state.tabs[activeTabIndex]);
  const pinTab = useStore((state) => state.pinTab);
  const rootDir = useStore((state) => state.rootDir);
  const tabs = useStore((state) => state.tabs);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const removeTabByIndex = useStore((state) => state.removeTabByIndex);

  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  const onClickTab = () => {
    setActiveTabId(tabId)
    setShowSearch(false)
  }

  const onDoubleClickTab = () => {
    if (activeTabIndex === tabIndex) {
      pinTab();
    }
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
          onDoubleClick={onDoubleClickTab}
          className={`flex w-full h-8 justify-center items-center rounded-none border-r border-gray-200/80 ${activeTab.id == tabId ? 'bg-white' : 'bg-gray-50'}`}>
          <span className={`${!tabs[tabIndex].pinned ? 'italic' : ''}`}>{title} {tabs[tabIndex].changed && '*'}</span>
        </div>

        {/* Close tab button */}
        <div className='flex absolute right-1'>
          <button
            onClick={onCloseTab}
            className={`rounded-md p-[2px] mx-[0.5] my-2 text-neutral-400 focus:outline-none border-none dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 ${activeTab.id == tabId ? 'bg-white' : 'bg-gray-50'}`}>
            <CloseIcon className='w-5 h-5' />
          </button>
        </div>
      </div>

      {showConfirmModal && <ConfirmModal showModal={showConfirmModal} setShowModal={setShowConfirmModal} tabIndex={tabIndex} rootDir={rootDir} />}
    </>
  )
}

const TabsNav = () => {
  const tabs = useStore((state) => state.tabs);

  return (
    //  if tabs.length > 1, show this tabs nav
    tabs.length > 1 && (
      <div className="flex h-8 justify-center items-center border border-gray-200 bg-gray-50">
        {tabs.map((tab, index) => (
          <TabButton key={tab.id} title={tab.fileNode.path !== '' ? getFileName(tab.fileNode.path) : 'Untitled'} tabIndex={index} tabId={tab.id} />
        ))}
      </div>
    )
  )
}

export default TabsNav