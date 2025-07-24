import { useState, useMemo } from 'react'
import { useFileSystemStore } from '../stores/fileSystemStore'
import { useDebounce } from './useDebounce'
import { getAllMarkdownFiles } from '@renderer/utils/fileOperations'

export const useFileSearch = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { fileTree } = useFileSystemStore()

  // Flatten file tree to get all files
  const allFiles = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return []
    }
    return getAllMarkdownFiles(fileTree)
  }, [fileTree])

  // Get search results as flat list
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return []
    }

    // Use simple string matching for exact substring matches
    const searchLower = debouncedSearchTerm.toLowerCase()
    const matchedFiles = allFiles.filter(file => 
      file.name.toLowerCase().includes(searchLower) || 
      file.path.toLowerCase().includes(searchLower)
    )

    // Sort by priority: name matches first, then path matches
    return matchedFiles.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(searchLower)
      const bNameMatch = b.name.toLowerCase().includes(searchLower)
      
      // If both match name or both don't match name, keep original order
      if (aNameMatch === bNameMatch) {
        return 0
      }
      
      // Name matches get priority (come first)
      return aNameMatch ? -1 : 1
    })
  }, [debouncedSearchTerm, allFiles])

  const clearSearch = () => {
    setSearchTerm('')
  }

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching: Boolean(debouncedSearchTerm.trim()),
    clearSearch,
  }
}