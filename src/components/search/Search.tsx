import { useEffect } from 'react'
import useSearchStore from '../../store/SearchStore';
import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from '../icons';
import { MEditor } from '../../models/MEditor';

interface SearchProps {
  activeEditor: MEditor;
};

const Search = ({ activeEditor }: SearchProps) => {
  const searchText = useSearchStore((state) => state.searchText);
  const setSearchText = useSearchStore((state) => state.setSearchText);
  const searchResult = useSearchStore((state) => state.searchResult);
  const setShowSearch = useSearchStore((state) => state.setShowSearch);
  const currentSearchIndex = useSearchStore((state) => state.currentSearchIndex);
  const search = useSearchStore((state) => state.search);
  const goNext = useSearchStore((state) => state.goNext);
  const goPrev = useSearchStore((state) => state.goPrev);
  const clear = useSearchStore((state) => state.clear);

  useEffect(() => {
    const debouncedSearch = setTimeout(() => {
      handleSearch(searchText);
    }, 500); // 设置防抖时间间隔，例如 500 毫秒

    return () => {
      clearTimeout(debouncedSearch);
    };
  }, [searchText]);

  const handleSearch = async (text: string) => {
    if (text.length > 2) {
      search(activeEditor.editor);
    }
  }

  const onClose = () => {
    setShowSearch(false);
    clear();
  }

  const onGoNext = () => {
    goNext();
  }

  const onGoPrev = () => {
    goPrev();
  }

  return (
    <div className='flex flex-row absolute z-10 right-6 justify-center items-center bg-white shadow-lg shadow-gray-300 rounded-md'>
      <input
        type="text"
        // focus:outline-none: remove the border when clicked
        className="w-52 mx-3 my-2 px-4 py-[5px] rounded-md text-gray-800"
        placeholder="Search..."
        value={searchText}
        autoFocus={true}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onGoPrev();
          }
        }}
        onChange={e => setSearchText(e.target.value)} />
      <span className='w-20 text-sm text-gray-400 text-center'>{searchResult && searchResult.ranges.length > 0 ? (currentSearchIndex + 1) + ' / ' + searchResult.ranges.length : 'No results'}</span>
      <button
        onClick={onGoPrev}
        className={`rounded-md px-1 py-1 mx-[0.5] my-2 text-neutral-400 focus:outline-none dark:text-white bg-white border-none hover:bg-black/5 dark:hover:bg-neutral-600`} role="menuitem">
        <ArrowUpIcon className='w-4 h-4' />
      </button>
      <button
        onClick={onGoNext}
        className={`rounded-md px-1 py-1 mx-[0.5] my-2 text-neutral-400 focus:outline-none dark:text-white bg-white border-none hover:bg-black/5 dark:hover:bg-neutral-600`} role="menuitem">
        <ArrowDownIcon className='w-4 h-4' />
      </button>
      <button
        onClick={onClose}
        className={`rounded-md px-[3px] py-[3px] mx-[0.5] my-2 text-neutral-400 focus:outline-none dark:text-white bg-white border-none hover:bg-black/5 dark:hover:bg-neutral-600`} role="menuitem">
        <CloseIcon className='w-5 h-5' />
      </button>
    </div>
  )
}

export default Search