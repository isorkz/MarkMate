import { useEffect, useRef, MutableRefObject } from 'react';
import toast from 'react-hot-toast';
import { ChevronRightIcon, ChevronDownIcon, DocumentIcon } from '../icons'
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { FileTreeNode } from '../../models/FileTree'
import useSearchStore from '../../store/SearchStore';

interface TreeNodeProps {
  node: FileTreeNode;
  level?: number;
  editingNodeRef: MutableRefObject<FileTreeNode | undefined>;
  isFavoriteNodeType: boolean;
};

const TreeItem = ({
  node,
  level = 0,
  editingNodeRef,
  isFavoriteNodeType,
}: TreeNodeProps) => {
  const editingMode = useTreeStore((state) => state.editingMode);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);
  const updateTreeNode = useTreeStore((state) => state.updateTreeNode);
  const reset = useTreeStore((state) => state.reset);

  const dragSrc = useTreeStore((state) => state.dragSrc);
  const setDragSrc = useTreeStore((state) => state.setDragSrc);
  const dragDes = useTreeStore((state) => state.dragDes);
  const setDragDes = useTreeStore((state) => state.setDragDes);
  const move = useTreeStore((state) => state.move);

  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const activeTab = useStore((state) => state.tabs[activeTabIndex]);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const updateActiveTab = useStore((state) => state.updateActiveTab);
  const getTabIdByFileId = useStore((state) => state.getTabIdByFileId);
  const newTab = useStore((state) => state.newTab);
  const updateTreeNodeInTabs = useStore((state) => state.updateTreeNode);

  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  // To focus the input element when renaming a file.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingMode) {
      inputRef.current?.focus();
    }
  }, [editingMode]);

  const setMenuContext = (e: any) => {
    e.preventDefault();
    setEditingNode(node)
    editingNodeRef.current = node
    // show the menu
    window.ipcRenderer.send('show-file-tree-menu', { type: node.type, fileId: node.id, filePath: node.path, favorite: node.favorite });
  }

  const handleClick = () => {
    if (editingNode) {
      if (editingNode.path === node.path) {
        return
      }
      cancelEdit()
    }

    setShowSearch(false)

    if (!node.children) {
      handleClickFile()
    } else {
      handleClickFolder()
    }
  };

  const handleClickFile = () => {
    // If the file is already opened in the tabs, only activate the tab.
    // Otherwise, try to open this file in the current active tab.
    // But, if the current active tab is changed, create a new tab.
    const tabId = getTabIdByFileId(node.id);
    if (tabId) {
      setActiveTabId(tabId)
    } else {
      // window.api defined in preload.ts, and implemented in ipcHandler.ts
      window.api.readFile(node.path, (err: any, result: any) => {
        if (!err) {
          if (activeTab.changed) {
            newTab(node, result.content)
          } else {
            updateActiveTab(node, result.content)
          }
        } else {
          err = `Failed to read file content from ${node.path}. ${err}`;
          console.error(err);
          toast.error(err);
        }
      })
    }
  }

  const handleClickFolder = () => {
    updateTreeNode(node.id, { isOpened: !node.isOpened })
  }

  const handleNewFileEnd = () => {
    if (editingNode && editingMode && editingMode === 'newfile' && editingNode.name && editingNode.id === node.id) {
      let newFileName = editingNode.name;
      if (!newFileName.endsWith('.md')) {
        newFileName += '.md'
      }
      window.api.newFile(node.path, newFileName).then((newFilePath: any) => {
        updateTreeNode(node.id, { name: newFileName, path: newFilePath })
        console.log('Created new file:', newFilePath)
      }).catch((err: any) => {
        console.error(`Failed to create new file: ${node.path}/${newFileName}. ${err}`)
        toast.error(`Failed to create new file: ${node.path}/${newFileName}. ${err}`);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleNewFolderEnd = () => {
    if (editingNode && editingMode && editingMode === 'newfolder' && editingNode.name && editingNode.path === node.path) {
      let newFolderName = editingNode.name;
      window.api.newFolder(node.path, newFolderName).then((newFolderPath: any) => {
        updateTreeNode(node.id, { name: newFolderName, path: newFolderPath })
        console.log('Created new folder:', newFolderPath)
      }).catch((err: any) => {
        console.error(`Failed to create new folder: ${node.path}/${newFolderName}. ${err}`)
        toast.error(`Failed to create new folder: ${node.path}/${newFolderName}. ${err}`);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleRenameEnd = () => {
    if (editingNode && editingMode && editingMode === 'rename' && editingNode.name && editingNode.path === node.path && editingNode.name !== node.name) {
      const dir = node.path.replace(/[^/]+$/, '');
      let newName = editingNode.name;
      const newFilePath = dir + newName;
      window.api.renameFile(node.path, editingNode.name).then(() => {
        console.log('Renamed: ' + node.path + ' to ', newFilePath)
        updateTreeNode(node.id, { name: newName, path: newFilePath })
        updateTreeNodeInTabs(node.id, { name: newName, path: newFilePath })
      }).catch((err: any) => {
        console.error('Failed to rename file: ' + node.path + ' to ', newFilePath, err)
        toast.error('Failed to rename file: ' + node.path + ' to ' + newFilePath + err);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleEdit = () => {
    if (editingNode && editingMode) {
      if (editingMode === 'newfile') {
        handleNewFileEnd()
      } else if (editingMode === 'newfolder') {
        handleNewFolderEnd()
      } if (editingMode === 'rename') {
        handleRenameEnd()
      }
    }
  }

  const cancelEdit = () => {
    reset()
    editingNodeRef.current = undefined;
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingNode) {
      setEditingNode({ ...editingNode, name: e.target.value })
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setDragSrc(node);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (node === dragSrc) {
      setDragDes(undefined);
      return;
    }

    const { clientY } = e;
    const target = e.target as HTMLElement;
    const { top, bottom } = target.getBoundingClientRect();
    const middle = (top + bottom) / 2;
    const mode = clientY <= middle ? 'top' : 'bottom';
    setDragDes({ node, mode });
  };

  const handleDragEnd = () => {
    if (dragSrc && dragDes) {
      move()

      setDragSrc(undefined);
      setDragDes(undefined);
    }
  };

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={(e) => e.stopPropagation()}
        onDragEnd={handleDragEnd}
        className={
          dragDes && dragDes.node.path === node.path && (dragDes?.node.path !== dragSrc?.path || dragDes?.node.index !== dragSrc?.index)
            ? dragDes?.mode === 'top'
              ? 'border-t'
              : 'border-b'
            : ''
        }>
        <div className={`flex items-center my-1 hover:bg-neutral-700 ${node.id === activeTab.fileNode.id && 'bg-neutral-600'}`} style={{ paddingLeft: `${level}em` }}
          onClick={handleClick}
          onContextMenu={setMenuContext}
        >
          {node.type === 'folder' && (node.isOpened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
          {node.type !== 'folder' && <DocumentIcon className="w-4 h-4 mr-1.5 text-gray-400" />}
          {!isFavoriteNodeType && editingNode && ((editingMode === 'rename' && editingNode && editingNode.id === node.id) || ((editingMode === 'newfile' || editingMode === 'newfolder') && node.name === '')) ? (
            <input type="text"
              className='bg-transparent border-b border-gray-300 focus:border-gray-300 focus:outline-none'
              ref={inputRef}
              value={editingNode.name}
              onChange={onInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEdit();
                }
              }}
              onBlur={() => cancelEdit()} />
          ) : (
            <span className="text-gray-300">{node.name}</span>
          )}
        </div>
      </div>

      {node.isOpened && node.children &&
        [...node.children].sort((a, b) => (a.index < b.index) ? -1 : 1).map((childNode) =>
          <TreeItem node={childNode} level={level + 1} editingNodeRef={editingNodeRef} key={childNode.id} isFavoriteNodeType={isFavoriteNodeType} />
        )}
    </div>
  )
};

export default TreeItem;