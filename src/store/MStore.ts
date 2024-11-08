import { create } from "zustand";
import { persist, PersistStorage } from 'zustand/middleware'
import { MEditor } from "../models/MEditor";
import { markdownSourceToMEditorNodes } from "../components/editor/slate/parser/ParseMarkdownSourceToSlateNodes";
import { nanoid } from 'nanoid'
import { DefaultEmptySlateNodes } from "../components/editor/slate/Element";

const InitTabId = 'default_id_0';

interface MStore {
  rootDir: string | undefined;
  setRootDir: (rootDir: string | undefined) => void;

  tabs: MEditor[];
  setTabs: (tabs: MEditor[]) => void;

  activeTabIndex: number;
  activeTabId: string | undefined;
  setActiveTabId: (id: string) => void;

  // open a file in the current active tab (update the tab content)
  setActiveTab: (fileId: string, filePath: string, content: string, lastModifiedTime: Date) => void;
  getActiveTab: () => MEditor;
  getActiveFilePath: () => string | undefined;

  // open a file in a new tab
  newTab: (fileId: string, filePath: string, content: string, lastModifiedTime: Date) => void;
  // new a empty tab
  newEmptyTab: () => void;
  removeTabByIndex: (tabIndex: number) => void;
  removeTabByFilePath: (filePath: string) => void;

  updateSourceContent: (sourceContent: string) => void;
  updateSlateNodes: (slateNodes: any[]) => void;

  saveTab: () => void;
  saveTabs: () => void;

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
        const lastModifiedTime = new Date(tab.lastModifiedTime);
        return new MEditor(tab.id, rootDir, tab.fileId, tab.filePath, tab.sourceContent, lastModifiedTime, tab.slateNodes)
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
    (set, get) => ({
      // rootDir: undefined,
      rootDir: import.meta.env.VITE_APP_PATH.replace(/\\/g, '/'),
      setRootDir: (rootDir: string | undefined) => set({ rootDir: rootDir }),

      // for rootDir, always use '/'
      tabs: [new MEditor(InitTabId, import.meta.env.VITE_APP_PATH.replace(/\\/g, '/'))],
      setTabs: (tabs: MEditor[]) => set({ tabs: tabs }),

      activeTabIndex: 0,
      activeTabId: InitTabId,

      getActiveTab: () => {
        return get().tabs[get().activeTabIndex]
      },

      getActiveFilePath: () =>
        get().tabs[get().activeTabIndex].filePath,

      setActiveTab: (fileId: string, filePath: string, content: string, lastModifiedTime: Date) =>
        set((state) => {
          const newTabs = [...state.tabs];
          newTabs[state.activeTabIndex].changed = false;
          newTabs[state.activeTabIndex].fileId = fileId;
          newTabs[state.activeTabIndex].filePath = filePath;
          newTabs[state.activeTabIndex].lastModifiedTime = lastModifiedTime;
          newTabs[state.activeTabIndex].sourceContent = content;
          newTabs[state.activeTabIndex].slateNodes = markdownSourceToMEditorNodes(content) || DefaultEmptySlateNodes();

          return {
            ...state,
            tabs: newTabs
          };
        }),

      newTab: (fileId: string, filePath: string, content: string, lastModifiedTime: Date) =>
        set((state) => {
          const newTab = new MEditor(nanoid(), state.rootDir, fileId, filePath, content, lastModifiedTime);
          const newTabs = [...state.tabs, newTab];
          return {
            ...state,
            tabs: newTabs,
            activeTabId: newTab.id,
            activeTabIndex: newTabs.length - 1
          };
        }),

      newEmptyTab: () =>
        set((state) => {
          const newTab = new MEditor(nanoid(), state.rootDir);
          const newTabs = [...state.tabs, newTab];
          return {
            ...state,
            tabs: newTabs,
            activeTabId: newTab.id,
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
            activeTabId: newTabs[newActiveTabIndex].id,
            activeTabIndex: newActiveTabIndex
          };
        }),

      removeTabByFilePath: (filePath: string) =>
        set((state) => {
          const tabIndex = state.tabs.findIndex((tab) => tab.filePath === filePath);
          if (tabIndex < 0) {
            return {};
          }

          const newTabs = state.tabs.filter((_, index) => index !== tabIndex);
          if (newTabs.length === 0) {
            return {
              ...state,
              tabs: [new MEditor(InitTabId, state.rootDir)],
              activeTabId: InitTabId,
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
            activeTabId: newTabs[newActiveTabIndex].id,
            activeTabIndex: newActiveTabIndex
          };
        }),

      setActiveTabId: (id: string) =>
        set((state) => {
          const newTabIndex = state.tabs.findIndex((item) => item.id === id);
          if (newTabIndex >= 0) {
            return {
              ...state,
              activeTabId: id,
              activeTabIndex: newTabIndex,
            };
          }
          return {}
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

      saveTab: () =>
        set((state) => {
          const newTabs = [...state.tabs];
          newTabs[state.activeTabIndex].changed = false;
          newTabs[state.activeTabIndex].lastModifiedTime = new Date();
          return {
            ...state,
            tabs: newTabs
          };
        }),

      saveTabs: () =>
        set((state) => {
          const newTabs = state.tabs.map(tab => {
            tab.changed = false;
            return tab;
          });
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
