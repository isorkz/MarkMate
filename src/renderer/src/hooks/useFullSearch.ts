import { useState, useMemo, useEffect } from 'react'
import { useFileSystemStore } from '../stores/fileSystemStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { FileNode } from '../types'
import { useDebounce } from './useDebounce'
import { adapters } from '../adapters'

interface SearchableFile extends FileNode {
  content: string
}

export const useFullSearch = () => {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { fileTree } = useFileSystemStore()
  const { currentWorkspace } = useWorkspaceStore()
  const [filesWithContent, setFilesWithContent] = useState<SearchableFile[]>([])

  // Load markdown files with content
  useEffect(() => {
    if (!showSearch) return
    
    if (!currentWorkspace) {
      setFilesWithContent([])
      return
    }
    
    const loadMarkdownFiles = async () => {
      const result: SearchableFile[] = []
      
      const traverse = async (nodeList: FileNode[]) => {
        for (const node of nodeList) {
          if (node.type === 'file') {
            try {
              const content = await adapters.fileAdapter.readFile(currentWorkspace.path, node.path)
              result.push({ ...node, content })
            } catch (error) {
              console.error(`Failed to read ${node.path}:`, error)
            }
          }
          if (node.children) {
            await traverse(node.children)
          }
        }
      }
      
      await traverse(fileTree)
      setFilesWithContent(result)
    }
    
    loadMarkdownFiles()
  }, [fileTree, currentWorkspace, showSearch])

  // Custom search function with priority scoring
  const customSearch = (files: SearchableFile[], term: string) => {
    if (!term.trim()) return []
    
    const searchTerm = term.toLowerCase()
    
    return files
      .map(file => {
        const fileName = file.name.toLowerCase()
        const filePath = file.path.toLowerCase()
        const fileContent = file.content.toLowerCase()
        
        // Check for matches
        const nameMatch = fileName.includes(searchTerm)
        const pathMatch = filePath.includes(searchTerm) && !nameMatch // Avoid double counting
        const contentMatches = (fileContent.match(new RegExp(searchTerm, 'gi')) || []).length
        
        // Calculate scores (higher = better)
        let score = 0
        if (nameMatch) score += 1000 // Highest priority
        if (pathMatch) score += 500  // Medium priority
        score += contentMatches      // Content match frequency
        
        return {
          ...file,
          nameMatch,
          pathMatch,
          contentMatchCount: contentMatches,
          totalScore: score
        }
      })
      .filter(file => file.totalScore > 0) // Only return files with matches
      .sort((a, b) => {
        // Sort by total score (descending)
        if (a.totalScore !== b.totalScore) {
          return b.totalScore - a.totalScore
        }
        // If scores are equal, sort by name alphabetically
        return a.name.localeCompare(b.name)
      })
      .slice(0, 20) // Limit to top 20 results
  }

  // Get search results using custom search
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return []
    }

    return customSearch(filesWithContent, debouncedSearchTerm)
  }, [debouncedSearchTerm, filesWithContent])

  const openSearch = () => {
    setShowSearch(true)
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchTerm('')
  }

  const isSearching = searchTerm.trim() !== '' && searchTerm !== debouncedSearchTerm

  return {
    showSearch,
    openSearch,
    closeSearch,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
  }
}