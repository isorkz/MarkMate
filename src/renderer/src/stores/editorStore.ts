import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tab {
  id: string;
  filePath: string;
  title: string;
  content: string;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  lastModified: Date;
}

interface EditorStore {
  tabs: Tab[];
  activeTabId: string | null;
  showTOC: boolean;
  showSourceEditor: boolean;
  syncSroll: boolean;
  
  // Actions
  openFile: (filePath: string, content: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
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
      
      openFile: (filePath, content) => {
        const existingTab = get().tabs.find(tab => tab.filePath === filePath);
        if (existingTab) {
          set({ activeTabId: existingTab.id });
          return;
        }
        
        const newTab: Tab = {
          id: Date.now().toString(),
          filePath,
          title: filePath.split('/').pop() || 'Untitled',
          content,
          isActive: true,
          hasUnsavedChanges: false,
          lastModified: new Date()
        };
        
        set(state => ({
          tabs: [...state.tabs.map(tab => ({ ...tab, isActive: false })), newTab],
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
        set(state => ({
          tabs: state.tabs.map(tab => ({ ...tab, isActive: tab.id === tabId })),
          activeTabId: tabId
        })),
      
      updateTabContent: (tabId, content) => 
        set(state => ({
          tabs: state.tabs.map(tab => 
            tab.id === tabId 
              ? { ...tab, content, hasUnsavedChanges: true, lastModified: new Date() }
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