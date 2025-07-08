import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useFilePathEventStore } from './events/filePathEventStore'

export interface Tab {
  id: string;
  filePath: string;
  title: string;
  content: string;
  hasUnsavedChanges: boolean;
  lastModified: Date;
  isPinned?: boolean;
}

interface EditorStore {
  tabs: Tab[];
  activeTabId: string | null;
  showTOC: boolean;
  showSourceEditor: boolean;
  syncSroll: boolean;
  
  // Actions
  openFile: (filePath: string, content: string, isPinned?: boolean) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  pinTab: (tabId) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabDirty: (tabId: string, hasUnsavedChanges: boolean) => void;
  reorderTabs: (dragIndex: number, hoverIndex: number) => void;
  saveTabState: (tabId: string, state: Partial<Tab>) => void;
  toggleTOC: () => void;
  toggleSourceEditor: () => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      showTOC: true,
      showSourceEditor: false,
      syncSroll: true,
      
      openFile: (filePath, content, isPinned = false) => {
        const existingTab = get().tabs.find(tab => tab.filePath === filePath);
        if (existingTab) {
          set({ activeTabId: existingTab.id });
          return;
        }
        
        // If opening in preview mode, close existing unpinned tab first
        if (!isPinned) {
          const tabs = get().tabs;
          const unpinnedTab = tabs.find(tab => !tab.isPinned);
          if (unpinnedTab) {
            get().closeTab(unpinnedTab.id);
          }
        }
        
        const newTab: Tab = {
          id: Date.now().toString(),
          filePath,
          title: filePath.split('/').pop() || 'Untitled',
          content,
          hasUnsavedChanges: false,
          lastModified: new Date(),
          isPinned
        };
        
        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id
        }));
      },
      
      closeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        const newTabs = tabs.filter(tab => tab.id !== tabId);
        let newActiveTabId = activeTabId;
        
        if (activeTabId === tabId) {
          newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }
        
        set({ tabs: newTabs, activeTabId: newActiveTabId });
      },
      
      setActiveTab: (tabId) => 
        set({ activeTabId: tabId }),
      
      pinTab: (tabId) => 
        set(state => ({
          tabs: state.tabs.map(tab => 
            tab.id === tabId ? { ...tab, isPinned: true } : tab
          )
        })),
      
      updateTabContent: (tabId, content) => 
        set(state => ({
          tabs: state.tabs.map(tab => 
            tab.id === tabId 
              ? { ...tab, content, hasUnsavedChanges: true, lastModified: new Date(), isPinned: true }
              : tab
          )
        })),
      
      markTabDirty: (tabId, hasUnsavedChanges) => 
        set(state => ({
          tabs: state.tabs.map(tab => 
            tab.id === tabId ? { ...tab, hasUnsavedChanges } : tab
          )
        })),
      
      reorderTabs: (dragIndex, hoverIndex) => {
        const tabs = [...get().tabs];
        const draggedTab = tabs[dragIndex];
        tabs.splice(dragIndex, 1);
        tabs.splice(hoverIndex, 0, draggedTab);
        set({ tabs });
      },
      
      saveTabState: (tabId, state) => 
        set(currentState => ({
          tabs: currentState.tabs.map(tab => 
            tab.id === tabId ? { ...tab, ...state } : tab
          )
        })),
      
      toggleTOC: () => set(state => ({ showTOC: !state.showTOC })),
      
      toggleSourceEditor: () => set(state => ({ showSourceEditor: !state.showSourceEditor }))
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        showTOC: state.showTOC,
        showSourceEditor: state.showSourceEditor,
        tabs: state.tabs,
        activeTabId: state.activeTabId
      })
    }
  )
)

// Subscribe to file path events
useFilePathEventStore.subscribe((state) => {
  const pathChange = state.lastPathChange
  if (pathChange) {
    const { oldPath, newPath } = pathChange
    const { tabs } = useEditorStore.getState()
    
    // Update tab file paths and titles
    const updatedTabs = tabs.map(tab => {
      if (tab.filePath === oldPath) {
        return {
          ...tab,
          filePath: newPath,
          title: newPath.split('/').pop() || 'Untitled'
        }
      } else if (tab.filePath.startsWith(oldPath + '/')) {
        const newFilePath = tab.filePath.replace(oldPath, newPath)
        return {
          ...tab,
          filePath: newFilePath,
          title: newFilePath.split('/').pop() || 'Untitled'
        }
      }
      return tab
    })
    
    useEditorStore.setState({ tabs: updatedTabs })
  }
})

useFilePathEventStore.subscribe((state) => {
  const pathDelete = state.lastPathDelete
  if (pathDelete) {
    const { path } = pathDelete
    const { tabs, activeTabId } = useEditorStore.getState()
    
    // Find tabs that need to be closed
    const tabsToClose = tabs.filter(tab => 
      tab.filePath === path || tab.filePath.startsWith(path + '/')
    )
    
    // Close the tabs
    tabsToClose.forEach(tab => {
      useEditorStore.getState().closeTab(tab.id)
    })
  }
})