import toast from "react-hot-toast";
import useStore from "../../store/MStore";
import useTreeStore from "../../store/TreeStore";
import { getFormatDateStr } from '../../utils/common'
import { LayoutSplitIcon, RefreshIcon, SyncFailedIcon, SyncOutOfDateIcon, SyncUpToDateIcon, SyncingIcon, TocIcon } from "../icons";
import { FunctionComponent, useEffect, MouseEvent } from "react";

interface MenuItemProps {
  className: string;
  icon: FunctionComponent<{ className: string }>;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}

const MenuButton: React.FC<MenuItemProps> = ({ icon: Icon, className, onClick }) => {
  return (
    <button type="button" className={`p-2 mx-1 bg-transparent border-none text-blue-400 hover:bg-gray-200 focus:outline-none ${className}`}
      onClick={(e) => onClick(e)}>
      <Icon className="w-4 h-4" />
    </button>
  );
};

interface TopBarProps {
  title: string;
  changed: boolean;
  lastModifiedTime: Date;
};

const MainPanelTopBar = ({ title, changed, lastModifiedTime }: TopBarProps) => {
  const showLeftSidebar = useStore((state) => state.showLeftSidebar);
  const toggleTocPanel = useStore((state) => state.toggleTocPanel);
  const toggleMarkdownSourceEditor = useStore((state) => state.toggleMarkdownSourceEditor);
  const rootDir = useStore((state) => state.rootDir);
  const getActiveFilePath = useStore((state) => state.getActiveFilePath);

  const loadTree = useTreeStore((state) => state.loadTree);
  const syncStatus = useTreeStore((state) => state.syncStatus);
  const setSyncStatus = useTreeStore((state) => state.setSyncStatus);

  const onRefreshFileTree = () => {
    loadTree(rootDir, getActiveFilePath())
  }

  const onSyncUp = () => {
    const remoteRepo = import.meta.env.VITE_APP_GIT_REMOTE_REPO;
    if (syncStatus !== 'syncing') {
      setSyncStatus('syncing');
      window.api.gitSync(rootDir, remoteRepo).then(() => {
        setSyncStatus('up-to-date');
      }).catch((error: any) => {
        console.error('git sync error: ', error);
        toast.error('Failed to sync up the remote repository: ', error);
        setSyncStatus('failed');
      })
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkGitStatus = async () => {
      console.log('checkGitStatus: ', rootDir);
      window.api.gitStatus(rootDir).then((status: any) => {
        setSyncStatus(status);
      }).catch((error: any) => {
        console.error('git status error: ', error);
        toast.error('git status error: ', error);
        setSyncStatus('failed');
      })
    }

    const startChecking = () => {
      checkGitStatus(); // check once first
      intervalId = setInterval(checkGitStatus, 60 * 1000); // check git status every minute
    };

    const stopChecking = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    // If the window is unfocused, stop checking
    if (document.visibilityState === 'visible') {
      startChecking();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startChecking();
      } else {
        stopChecking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopChecking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className={`relative flex w-full z-10 h-10 bg-gray-50 items-center px-4 border-b border-gray-200/80 select-none`}>
      {/* Leave this div to show menu icon buttons, and make the left sidebar draggable */}
      {/* If let the whole top bar draggable, the menu icon buttons cannot be clicked normally */}
      <div className={`${showLeftSidebar ? 'w-0' : 'w-32'} transition-all duration-300`}>
      </div>

      <div className='flex w-full justify-between'>
        <div className='flex w-full justify-between'>
          {/* draggable part */}
          {/* flex-grow: grow to take the remaining space */}
          <div className='flex flex-grow items-center' style={{ WebkitAppRegion: 'drag' } as any}>
            <div className='text-gray-500 text-sm font-medium'>
              {title} {changed && '*'}
            </div>
          </div>

          {/* Show edited datetime */}
          <div className='flex items-center' style={{ WebkitAppRegion: 'drag' } as any}>
            <div className='text-gray-400 text-sm font-normal m-8'>
              Edited {getFormatDateStr(lastModifiedTime)}
            </div>
          </div>
        </div>

        {/* menu items part */}
        <div className='flex'>
          <button onClick={toggleMarkdownSourceEditor} className='p-2 mx-1 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
            <LayoutSplitIcon className="w-4 h-4" />
          </button>
          <button onClick={toggleTocPanel} className='p-2 mx-1 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
            <TocIcon className="w-4 h-4" />
          </button>
          <button onClick={onRefreshFileTree} className='p-2 mx-1 bg-transparent border-none hover:bg-gray-200 focus:outline-none'>
            <RefreshIcon className="w-4 h-4" />
          </button>


          {syncStatus === 'up-to-date' ? (
            <MenuButton icon={SyncUpToDateIcon} className='text-blue-400' onClick={onSyncUp} />
          ) : syncStatus === 'out-of-date' ? (
            <MenuButton icon={SyncOutOfDateIcon} className='text-red-500' onClick={onSyncUp} />
          ) : (syncStatus === 'syncing') ? (
            <MenuButton icon={SyncingIcon} className='text-blue-400' onClick={onSyncUp} />
          ) : (
            <MenuButton icon={SyncFailedIcon} className='text-red-500' onClick={onSyncUp} />
          )}
        </div>
      </div>
    </div>
  )
}

export default MainPanelTopBar