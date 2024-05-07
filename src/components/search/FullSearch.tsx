import { Dispatch, MouseEvent, SetStateAction, useCallback, useEffect, useState } from 'react'
import { ArrowReturnRightIcon, CloseIcon, DocumentIcon } from '../icons';
import useTreeStore from '../../store/TreeStore';
import { FullSearchResult } from '../../models/Search';
import { FullSearchUtils } from '../../utils/search/FullSearchUtils';
import { getFolderPath } from '../../utils/common';
import useStore from '../../store/MStore';

import Divider from '@mui/material/Divider';
import { SlateEditorUtils } from '../editor/slate/SlateEditorUtils';

interface FullSearchProps {
  setShowFullSearch: Dispatch<SetStateAction<boolean>>;
};

const FullSearch = ({ setShowFullSearch }: FullSearchProps) => {
  const [searchText, setSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FullSearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  const slateNodesCache = useTreeStore((state) => state.slateNodesCache);
  const fileTree = useTreeStore((state) => state.fileTree);

  const rootDir = useStore((state) => state.rootDir);
  const setActiveTabIndex = useStore((state) => state.setActiveTabIndex);
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const tabs = useStore((state) => state.tabs);
  const newTab = useStore((state) => state.newTab);

  useEffect(() => {
    const debouncedSearch = setTimeout(() => {
      handleSearch(searchText.trim());
    }, 500); // 设置防抖时间间隔，例如 500 毫秒

    return () => {
      clearTimeout(debouncedSearch);
    };
  }, [searchText]);

  const handleSearch = useCallback((text: string) => {
    if (text.length > 2) {
      const results = fullSearch(text);
      // Sort the search results by match score.
      setSearchResults(results.sort((a: FullSearchResult, b: FullSearchResult) => b.matchScore - a.matchScore));
    } else {
      setSearchResults([]);
    }
  }, [])

  const fullSearch = useCallback((searchText: string) => {
    if (fileTree) {
      return FullSearchUtils.fullSearch(slateNodesCache, fileTree, searchText)
    } else {
      return []
    }
  }, [])

  const onOpen = (event: MouseEvent<HTMLElement>, filePath: string) => {
    event.preventDefault();

    // If the file is already opened in the tabs, only activate the tab.
    const index = tabs.findIndex((tab) => tab.filePath === filePath);
    if (index >= 0) {
      setActiveTabIndex(index)
    } else {
      window.api.readFile(filePath, (err: any, data: any) => {
        if (err) {
          console.error(err);
        } else {
          if (activeTab().changed) {
            newTab(filePath, data)
          } else {
            setActiveTab(filePath, data)
            // Reset the slate nodes when switching to another tab, and clear the history.
            SlateEditorUtils.resetSlateNodes(activeTab().editor, activeTab().slateNodes, true);
            setShowFullSearch(false);
            setSearchResults([]);
            setSearchText('');
          }
        }
      })
    }
  };

  const onClose = () => {
    setShowFullSearch(false);
  }

  return (
    <div className='flex w-full absolute z-10 justify-center items-center top-[10%]'>
      <div className='flex relative w-full justify-center items-center'>
        <div className='flex flex-row w-1/2 justify-center items-center bg-white shadow-xl shadow-gray-400 rounded-md'>
          <input
            type="text"
            // focus:outline-none: remove the border when clicked
            className="w-full mx-3 my-2 px-4 py-[5px] rounded-md text-gray-800"
            placeholder="Search..."
            value={searchText}
            autoFocus={true}
            // onKeyDown={e => {
            // if (e.key === 'go down') {
            //   onGoPrev();
            // }
            // }}
            onChange={e => setSearchText(e.target.value)} />
          <button
            onClick={onClose}
            className={`rounded-md px-[3px] py-[3px] mx-[0.5] my-2 text-neutral-400  dark:text-white bg-white border-none hover:bg-black/5 dark:hover:bg-neutral-600`}>
            <CloseIcon className='w-5 h-5' />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="absolute w-1/2 top-full h-auto max-h-[70vh] overflow-y-auto z-10 py-1 bg-white text-gray-700 rounded-md select-none text-xs shadow-xl shadow-gray-400 ring-1 ring-black ring-opacity-5 focus:outline-none">
            {searchResults.slice(0, 20).map((result, i) => (
              <div key={result.filePath} className='flex w-full flex-col px-4 py-[0.4rem] items-center'>
                {i > 0 && <Divider orientation='horizontal' flexItem />}

                <div className='flex flex-col w-full mt-3 hover:bg-gray-100' onClick={(e) => onOpen(e, result.filePath)}>
                  <div className='flex flex-row items-center'>
                    <DocumentIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span className='font-semibold text-base'>{result.title}</span>
                    {rootDir && <span className='mx-4 text-sm font-medium text-gray-400'>{getFolderPath(rootDir, result.filePath)}</span>}
                  </div>

                  {result.matchContents.slice(0, 5).map((matchResult, j) => (
                    <div key={j} className='flex px-4 py-[0.4rem] items-center hover:bg-gray-100'>
                      <ArrowReturnRightIcon className="w-3 h-3 mr-2" />
                      <span>{matchResult.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FullSearch