import { create } from "zustand";
import { MDocument } from "../models/MDocument";
import { persist, createJSONStorage } from 'zustand/middleware'

interface MStore {
  dirPath: string | undefined;
  setDirPath: (dirPath: string | undefined) => void;

  currentDocument: MDocument;
  setCurrentDocument: (doc: MDocument) => void;

  updateSourceContent: (sourceContent: string) => void;
  updateSlateNodes: (slateNodes: any[]) => void;
}

const useStore = create<MStore>()(
  // persist: to persist the store in localStorage
  persist(
    (set) => ({
      // dirPath: undefined,
      dirPath: import.meta.env.VITE_APP_PATH,
      setDirPath: (dirPath: string | undefined) => set({ dirPath: dirPath }),

      currentDocument: {
        filePath: undefined,
        sourceContent: 'A line of text in a paragraph.',
        slateNodes: [
          {
            type: 'paragraph',
            children: [{ text: 'A line of text in a paragraph.' }],
          }
        ],
      },
      setCurrentDocument: (doc: MDocument) => set({ currentDocument: doc }),

      updateSourceContent: (sourceContent: string) =>
        set((state) => {
          if (state.currentDocument) {
            return { currentDocument: { ...state.currentDocument, sourceContent: sourceContent } };
          }
          return {};
        }),

      updateSlateNodes: (slateNodes: any[]) =>
        set((state) => {
          if (state.currentDocument) {
            return { currentDocument: { ...state.currentDocument, slateNodes: slateNodes } };
          }
          return {};
        }),
    }),
    {
      name: 'markmate-storage',          // unique name
      storage: createJSONStorage(() => localStorage),  // (optional) by default the 'localStorage' is used
    }
  ));

export default useStore