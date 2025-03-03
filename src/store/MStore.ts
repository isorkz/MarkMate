import { create } from "zustand";
import { persist, PersistStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { MEditor } from "../models/MEditor";
import { FileTreeNode } from "../models/FileTree";

const InitTabId = 'default_id_0';

interface MStore {
  rootDir: string | undefined;
  setRootDir: (rootDir: string | undefined) => void;

  tabs: MEditor[];

  activeTabIndex: number;
  setActiveTabId: (id: string) => void;

  // open a file in a new tab
  newTab: (fileNode: FileTreeNode, content: string) => void;
  // open a file in the current active tab (update the tab content)
  updateActiveTab: (fileNode: FileTreeNode, content: string) => void;
  updateSourceContent: (sourceContent: string) => void;
  updateSlateNodes: (slateNodes: any[]) => void;

  removeTabByIndex: (tabIndex: number) => void;
  removeTabByFileId: (fileId: string) => void;
  saveTab: () => void;

  getTabIdByFileId: (fileId: string) => string | undefined;
  updateTreeNode: (fileId: string, updatedFields: Partial<FileTreeNode>) => void;

  showLeftSidebar: boolean;
  toggleLeftSidebar: () => void;

  showTocPanel: boolean;
  toggleTocPanel: () => void;

  showMarkdownSourceEditor: boolean;
  toggleMarkdownSourceEditor: () => void;
}

// Note: Because the ReactEditor in slate is not serializable, we need to customize the storage to do not persist the editor, and recreate it when loading the state.
const customStorage: PersistStorage<MStore> = {
  getItem: (name) => {
    const str = localStorage.getItem(name)
    if (!str) return null

    const state: any = JSON.parse(str);
    // Note: state parsed from str includes two fields: state and version
    // So, tabs is in state.state.tabs
    const rootDir = state.state.rootDir;
    const tabs = state.state.tabs;
    // Recreate the editor
    if (tabs) {
      const newTabs: MEditor[] = tabs.map((tab: any) => {
        return new MEditor(tab.id, rootDir, tab.fileNode, tab.sourceContent, tab.slateNodes)
      });
      state.state.tabs = newTabs;
    }
    return state;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value))
  },
  removeItem: (name) => localStorage.removeItem(name),
}

const useStore = create<MStore>()(
  // persist: to persist the store in localStorage
  // https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md
  persist(
    // subscribeWithSelector(
    (set, get) => ({
      rootDir: import.meta.env.VITE_APP_PATH.replace(/\\/g, '/'),
      setRootDir: (rootDir: string | undefined) => set({ rootDir: rootDir }),

      // for rootDir, always use '/'
      tabs: [new MEditor(InitTabId, import.meta.env.VITE_APP_PATH.replace(/\\/g, '/'))],

      activeTabIndex: 0,

      setActiveTabId: (id: string) =>
        set((state) => {
          const newTabIndex = state.tabs.findIndex((item) => item.id === id);
          if (newTabIndex >= 0) {
            return {
              ...state,
              activeTabIndex: newTabIndex,
            };
          }
          return {}
        }),

      updateActiveTab: (fileNode: FileTreeNode, content: string) =>
        set((state) => {
          if (state.tabs[state.activeTabIndex].changed) {
            throw new Error('The current tab has unsaved changes. Please save it first.');
          }

          const newTab = new MEditor(nanoid(), state.rootDir, fileNode, content);
          const newTabs = [...state.tabs];
          newTabs[state.activeTabIndex] = newTab;
          return {
            ...state,
            tabs: newTabs
          };
        }),

      newTab: (fileNode: FileTreeNode, content: string) =>
        set((state) => {
          const newTab = new MEditor(nanoid(), state.rootDir, fileNode, content);
          const newTabs = [...state.tabs, newTab];
          return {
            ...state,
            tabs: newTabs,
            activeTabIndex: newTabs.length - 1
          };
        }),

      removeTabByIndex: (tabIndex: number) =>
        set((state) => {
          const newTabs = state.tabs.filter((_, index) => index !== tabIndex);
          let newActiveTabIndex = state.activeTabIndex;
          if (state.activeTabIndex === tabIndex) {
            newActiveTabIndex = 0;
          } else {
            if (state.activeTabIndex > tabIndex) {
              newActiveTabIndex = state.activeTabIndex - 1;
            }
          }
          return {
            ...state,
            tabs: newTabs,
            activeTabIndex: newActiveTabIndex
          };
        }),

      removeTabByFileId: (fileId: string) =>
        set((state) => {
          const tabIndex = state.tabs.findIndex((tab) => tab.fileNode?.id === fileId);
          if (tabIndex < 0) {
            return {};
          }

          const newTabs = state.tabs.filter((_, index) => index !== tabIndex);
          if (newTabs.length === 0) {
            return {
              ...state,
              tabs: [new MEditor(InitTabId, state.rootDir)],
              activeTabIndex: 0
            };
          }

          let newActiveTabIndex = state.activeTabIndex;
          if (state.activeTabIndex === tabIndex) {
            newActiveTabIndex = 0;
          } else {
            if (state.activeTabIndex > tabIndex) {
              newActiveTabIndex = state.activeTabIndex - 1;
            }
          }
          return {
            ...state,
            tabs: newTabs,
            activeTabIndex: newActiveTabIndex
          };
        }),

      updateSourceContent: (sourceContent: string) =>
        set((state) => {
          const newTabs = [...state.tabs];
          newTabs[state.activeTabIndex].sourceContent = sourceContent;
          newTabs[state.activeTabIndex].changed = true;
          return {
            ...state,
            tabs: newTabs
          };
        }),

      updateSlateNodes: (slateNodes: any[]) =>
        set((state) => {
          const newTabs = [...state.tabs];
          newTabs[state.activeTabIndex].slateNodes = slateNodes;
          newTabs[state.activeTabIndex].changed = true;
          return {
            ...state,
            tabs: newTabs
          };
        }),

      getTabIdByFileId: (fileId: string) => {
        const tabIndex = get().tabs.findIndex((tab) => tab.fileNode?.id === fileId);
        if (tabIndex >= 0) {
          return get().tabs[tabIndex].id;
        }
        return undefined;
      },

      updateTreeNode: (fileId: string, updatedFields: Partial<FileTreeNode>) =>
        set((state) => {
          // Update the fileNode in the tab
          const newTabs = [...state.tabs];
          const tabIndex = state.tabs.findIndex((tab) => tab.fileNode?.id === fileId);
          if (tabIndex >= 0) {
            const fileNode = newTabs[tabIndex].fileNode;
            if (fileNode) {
              // Do not allow to update id, type, children
              const allowedUpdates = { ...updatedFields };
              delete allowedUpdates.id;
              delete allowedUpdates.type;
              delete allowedUpdates.children;

              // Update the node
              Object.assign(fileNode, updatedFields);

              return {
                ...state,
                tabs: newTabs
              };
            }
          }

          return {}
        }),

      saveTab: () =>
        set((state) => {
          const newTabs = [...state.tabs];
          newTabs[state.activeTabIndex].changed = false;
          const fileNode = newTabs[state.activeTabIndex].fileNode;
          if (fileNode) {
            fileNode.lastModifiedTime = new Date();
          }
          return {
            ...state,
            tabs: newTabs
          };
        }),

      showLeftSidebar: true,

      toggleLeftSidebar: () =>
        set((state) => {
          return {
            ...state,
            showLeftSidebar: !state.showLeftSidebar
          };
        }),

      showTocPanel: true,

      toggleTocPanel: () =>
        set((state) => {
          return {
            ...state,
            showTocPanel: !state.showTocPanel
          };
        }),

      showMarkdownSourceEditor: false,

      toggleMarkdownSourceEditor: () =>
        set((state) => {
          return {
            ...state,
            showMarkdownSourceEditor: !state.showMarkdownSourceEditor
          };
        }),
    }),
    {
      name: 'markmate-store',          // unique name. For debugging, you can find it in Chrome DevTools 'Application' tab
      // storage: createJSONStorage(() => localStorage),  // (optional) by default the 'localStorage' is used
      storage: customStorage,
      // partialize: enables you to pick some of the state's fields to be stored in the storage.
      partialize: (state) => {
        // Remove the editor from each tab before saving to localStorage
        const newTabs = state.tabs.map(tab => {
          const { editor, ...rest } = tab;
          return rest;
        });

        return { ...state, tabs: newTabs };
      },
    }
  ));

export default useStore

// subscribe to the state changes, and the callback will be called when the state changes
// useStore.subscribe(
//   (state) => state.tabs[state.activeTabIndex]?.fileNode,
//   (fileNode: FileTreeNode | undefined) => {
//     if (fileNode) {
//       console.log('fileNode updated: ', fileNode)
//       useTreeStore.getState().updateTreeNode(fileNode.id, fileNode)
//     }
//   }
// );