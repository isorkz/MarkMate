import { useEffect, useRef, MutableRefObject } from 'react';
import { ChevronRightIcon, ChevronDownIcon, DocumentIcon } from '../icons'
import useStore from '../../store/MStore'
import useTreeStore from '../../store/TreeStore'
import { TreeNode } from '../../models/FileTree'
import toast from 'react-hot-toast';
import { SlateEditorUtils } from '../editor/slate/SlateEditorUtils';
import useSearchStore from '../../store/SearchStore';

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
  editingNodeRef: MutableRefObject<TreeNode | undefined>;
};

const TreeItem = ({
  node,
  level = 0,
  editingNodeRef,
}: TreeNodeProps) => {
  const fileTree = useTreeStore((state) => state.fileTree);
  const setFileTree = useTreeStore((state) => state.setFileTree);
  const editingNode = useTreeStore((state) => state.editingNode);
  const setEditingNode = useTreeStore((state) => state.setEditingNode);
  const editingMode = useTreeStore((state) => state.editingMode);
  const reset = useTreeStore((state) => state.reset);

  const dragSrc = useTreeStore((state) => state.dragSrc);
  const setDragSrc = useTreeStore((state) => state.setDragSrc);
  const dragDes = useTreeStore((state) => state.dragDes);
  const setDragDes = useTreeStore((state) => state.setDragDes);
  const move = useTreeStore((state) => state.move);

  const activeTabIndex = useStore((state) => state.activeTabIndex);
  const setActiveTabId = useStore((state) => state.setActiveTabId);
  const getActiveTab = useStore((state) => state.getActiveTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const tabs = useStore((state) => state.tabs);
  const setTabs = useStore((state) => state.setTabs);
  const newTab = useStore((state) => state.newTab);

  const setShowSearch = useSearchStore((state) => state.setShowSearch);

  // To focus the input element when renaming a file.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingMode && (editingMode === 'rename' || editingMode === 'newfile')) {
      inputRef.current?.focus();
    }
  }, [editingMode]);

  const handleClick = () => {
    if (editingNode) {
      if (editingNode.path === node.path) {
        return
      }
      cancelEdit()
    }

    setShowSearch(false)

    if (!node.children) {
      // If the file is already opened in the tabs, only activate the tab.
      const index = tabs.findIndex((tab) => tab.filePath === node.path);
      if (index >= 0) {
        setActiveTabId(tabs[index].id)
      } else {
        // window.api defined in preload.ts, and implemented in ipcHandler.ts
        window.api.readFile(node.path, (err: any, result: any) => {
          if (err) {
            console.error(err);
          } else {
            const lastModifiedTime = new Date(result.lastModifiedTime);
            if (getActiveTab().changed) {
              newTab(node.id, node.path, result.content, lastModifiedTime)
            } else {
              setActiveTab(node.id, node.path, result.content, lastModifiedTime)
              // Reset the slate nodes when switching to another tab, and clear the history.
              SlateEditorUtils.resetSlateNodes(getActiveTab().editor, getActiveTab().slateNodes, true);
            }
          }
        })
      }
    } else {
      node.isOpened = !node.isOpened;
      const newTree = JSON.parse(JSON.stringify(fileTree));
      setFileTree(newTree);
    }
  };

  const onContextMenu = (e: any) => {
    e.preventDefault();
    setEditingNode(node)
    editingNodeRef.current = node
    // show the menu
    window.ipcRenderer.send('show-file-tree-menu', { type: node.type, fileId: node.id, filePath: node.path, favorite: node.favorite });
  }

  const handleRename = () => {
    if (editingNode && editingMode && editingMode === 'rename' && editingNode.name && editingNode.path === node.path && editingNode.name !== node.name) {
      const dir = node.path.replace(/[^/]+$/, '');
      const newFilePath = dir + editingNode.name;
      window.api.renameFile(node.path, editingNode.name).then(() => {
        console.log('renamed file:', node.path, ' to ', newFilePath)
        const oldFilePath = node.path;
        // Re-render file tree
        node.name = editingNode.name;
        node.path = newFilePath;
        const newTree = JSON.parse(JSON.stringify(fileTree));
        setFileTree(newTree);
        // update the tab's filePath
        let newTabs = tabs.map((tab) => {
          if (tab.filePath === oldFilePath) {
            tab.filePath = newFilePath;
          }
          return tab;
        })
        setTabs(newTabs);
      }).catch((err: any) => {
        console.error('failed to rename file: ', node.path, ' to ', newFilePath, err)
        toast.error('failed to rename file: ' + node.path + ' to ' + newFilePath + err);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleNewFile = () => {
    if (editingNode && editingMode && editingMode === 'newfile' && editingNode.name && editingNode.path === node.path) {
      let newFileName = editingNode.name;
      if (!newFileName.endsWith('.md')) {
        newFileName += '.md'
      }
      window.api.newFile(node.path, newFileName).then((newFilePath: any) => {
        // Re-render file tree
        node.name = newFileName;
        node.path = newFilePath;
        const newTree = JSON.parse(JSON.stringify(fileTree));
        setFileTree(newTree);
        console.log('Created new file:', newFilePath)
      }).catch((err: any) => {
        console.error(`Failed to create new file: ${node.path}/${newFileName}. ${err}`)
        toast.error(`Failed to create new file: ${node.path}/${newFileName}. ${err}`);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleNewFolder = () => {
    if (editingNode && editingMode && editingMode === 'newfolder' && editingNode.name && editingNode.path === node.path) {
      let newFolderName = editingNode.name;
      window.api.newFolder(node.path, newFolderName).then((newFolderPath: any) => {
        // Re-render file tree
        node.name = newFolderName;
        node.path = newFolderPath;
        const newTree = JSON.parse(JSON.stringify(fileTree));
        setFileTree(newTree);
        console.log('Created new folder:', newFolderPath)
      }).catch((err: any) => {
        console.error(`Failed to create new folder: ${node.path}/${newFolderName}. ${err}`)
        toast.error(`Failed to create new folder: ${node.path}/${newFolderName}. ${err}`);
      }).finally(() => {
        cancelEdit()
      })
    }
  }

  const handleEdit = () => {
    if (editingNode && editingMode) {
      if (editingMode === 'rename') {
        handleRename()
      } else if (editingMode === 'newfile') {
        handleNewFile()
      } else if (editingMode === 'newfolder') {
        handleNewFolder()
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
        <div className={`flex items-center my-1 hover:bg-neutral-700 ${node.path === tabs[activeTabIndex].filePath && 'bg-neutral-600'}`} style={{ paddingLeft: `${level}em` }}
          onClick={handleClick}
          onContextMenu={onContextMenu}
        >
          {node.type === 'folder' && (node.isOpened ? <ChevronDownIcon className="w-4 h-4 mr-1.5" /> : <ChevronRightIcon className="w-4 h-4 mr-1.5" />)}
          {node.type !== 'folder' && <DocumentIcon className="w-4 h-4 mr-1.5 text-gray-400" />}
          {editingNode && ((editingMode === 'rename' && editingNode && editingNode.path === node.path) || ((editingMode === 'newfile' || editingMode === 'newfolder') && node.name === '')) ? (
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
          <TreeItem node={childNode} level={level + 1} editingNodeRef={editingNodeRef} key={childNode.id} />
        )}
    </div>
  )
};

export default TreeItem;