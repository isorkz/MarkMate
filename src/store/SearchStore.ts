import { Editor, Node, Text, Range } from 'slate';
import { create } from "zustand";

export type SearchResult = {
  // use nodeToRangesMap in useDecorate to highlight the search results
  nodeToRangesMap: Map<Node, Range[]>;
  ranges: Range[];
};

const searchTextInSlateNodes = (editor: Editor, searchText: string): SearchResult => {
  const searchRanges: Range[] = [];
  const nodeToRangesMap: Map<Node, Range[]> = new Map();
  const nodes = Array.from(Editor.nodes(editor, {
    at: [],
    match: n => Text.isText(n),
  }))
  const searchTextLowerCase = searchText.toLowerCase()
  let matchCount = 0
  nodes.forEach(n => {
    const [node, path] = n
    if (Text.isText(node)) {
      const { text } = node
      const textLowerCase = text.toLowerCase()
      const parts = textLowerCase.split(searchTextLowerCase)
      let offset = 0
      const ranges: Range[] = [];

      parts.forEach((part, i) => {
        if (i !== 0) {
          matchCount += 1
          ranges.push({
            anchor: { path, offset: offset - searchTextLowerCase.length },
            focus: { path, offset },
            highlight: true,
            isCurrentHighlight: matchCount === 1 ? true : false,
          })
        }

        offset = offset + part.length + searchTextLowerCase.length
      })

      if (ranges.length > 0) {
        searchRanges.push(...ranges)
        nodeToRangesMap.set(node, ranges)
      }
    }
  });

  return { ranges: searchRanges, nodeToRangesMap };
}

interface SearchStore {
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;

  searchText: string;
  setSearchText: (text: string) => void;

  currentSearchIndex: number;
  setCurrentSearchIndex: (index: number) => void;

  searchResult: SearchResult | undefined;
  setSearchResult: (result: SearchResult) => void;

  search: (editor: Editor) => void;

  goPrev: () => void;
  goNext: () => void;

  clear: () => void;
}

// stored in memory
const useSearchStore = create<SearchStore>()(
  (set) => ({
    showSearch: false,
    setShowSearch: (show: boolean) => set({ showSearch: show }),

    searchText: '',
    setSearchText: (text: string) => set({ searchText: text }),

    currentSearchIndex: -1,
    setCurrentSearchIndex: (index: number) => set({ currentSearchIndex: index }),

    searchResult: undefined,
    setSearchResult: (result: SearchResult) =>
      set({
        currentSearchIndex: 0,
        searchResult: result,
      }),

    search: (editor: Editor) =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.searchText || state.searchText === '') return {};

        return {
          currentSearchIndex: 0,
          searchResult: searchTextInSlateNodes(editor, state.searchText)
        }
      }),

    goPrev: () =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.searchResult || state.searchResult.ranges.length === 0) return {};

        let newCurrentIndex = state.currentSearchIndex - 1
        if (newCurrentIndex < 0) {
          newCurrentIndex = state.searchResult.ranges.length - 1
        }

        const newRanges = state.searchResult.ranges.map((r, i) => {
          return { ...r, isCurrentHighlight: i === newCurrentIndex };
        });

        const newNodeToRangesMap = new Map(state.searchResult.nodeToRangesMap);
        newNodeToRangesMap.forEach((ranges, node) => {
          const updatedRanges = ranges.map(range => {
            if (Range.equals(range, newRanges[newCurrentIndex])) {
              return { ...range, isCurrentHighlight: true };
            } else {
              return { ...range, isCurrentHighlight: false };
            }
          });
          newNodeToRangesMap.set(node, updatedRanges);
        });

        return {
          currentSearchIndex: newCurrentIndex,
          searchResult: { ...state.searchResult, ranges: newRanges, nodeToRangesMap: newNodeToRangesMap }
        };
      }),

    goNext: () =>
      set((state) => {
        // return {} means nothing needs to re-render
        if (!state.searchResult || state.searchResult.ranges.length === 0) return {};

        let newCurrentIndex = state.currentSearchIndex + 1
        if (newCurrentIndex >= state.searchResult.ranges.length) {
          newCurrentIndex = 0
        }

        const newRanges = state.searchResult.ranges.map((r, i) => {
          return { ...r, isCurrentHighlight: i === newCurrentIndex };
        });

        const newNodeToRangesMap = new Map(state.searchResult.nodeToRangesMap);
        newNodeToRangesMap.forEach((ranges, node) => {
          const updatedRanges = ranges.map(range => {
            if (Range.equals(range, newRanges[newCurrentIndex])) {
              return { ...range, isCurrentHighlight: true };
            } else {
              return { ...range, isCurrentHighlight: false };
            }
          });
          newNodeToRangesMap.set(node, updatedRanges);
        });

        return {
          currentSearchIndex: newCurrentIndex,
          searchResult: { ...state.searchResult, ranges: newRanges, nodeToRangesMap: newNodeToRangesMap }
        };
      }),

    clear: () => set({ searchText: '', currentSearchIndex: -1, searchResult: undefined }),
  })
);

export default useSearchStore