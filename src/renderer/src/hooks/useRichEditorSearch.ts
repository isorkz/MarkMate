import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { useDebounce } from './useDebounce'

export const useRichEditorSearch = (editor: Editor | null) => {
  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const goToSelection = useCallback(() => {
    if (!editor) return

    const { results, resultIndex } = editor.storage.searchAndReplace
    const position = results[resultIndex]

    if (!position) return

    editor.commands.setTextSelection(position)

    const { node } = editor.view.domAtPos(editor.state.selection.anchor)
    node instanceof HTMLElement &&
      node.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [editor])

  const nextMatch = useCallback(() => {
    if (!editor) return
    editor.commands.nextSearchResult()
    goToSelection()
  }, [editor, goToSelection])

  const prevMatch = useCallback(() => {
    if (!editor) return
    editor.commands.previousSearchResult()
    goToSelection()
  }, [editor, goToSelection])

  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setSearchTerm('')
    if (editor) {
      editor.commands.setSearchTerm('')
      editor.commands.resetIndex()
    }
  }, [editor])

  const openSearch = useCallback(() => {
    setShowSearch(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }, [])

  // Effect to perform search when debounced term changes
  useEffect(() => {
    if (editor) {
      editor.commands.setSearchTerm(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, editor])

  // Get search results from extension
  const searchResults = editor?.storage.searchAndReplace || {}
  const totalMatches = searchResults.results?.length || 0
  const currentMatchIndex = searchResults.resultIndex || 0

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        openSearch()
      }
      if (e.key === 'Escape' && showSearch) {
        closeSearch()
      }
      if (showSearch && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          prevMatch()
        } else {
          nextMatch()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSearch, openSearch, closeSearch, nextMatch, prevMatch])

  return {
    showSearch,
    searchTerm,
    currentMatchIndex,
    totalMatches,
    searchInputRef,
    nextMatch,
    prevMatch,
    closeSearch,
    openSearch,
    setSearchTerm
  }
}