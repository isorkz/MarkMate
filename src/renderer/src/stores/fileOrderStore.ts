import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import superjson from 'superjson'

type StorageValue<T> = { state: T; version?: number }

// Maps: workspacePath → parentFolderPath → ordered child paths (relative to workspace)
// Root level uses '' as parentFolderPath
type OrderMap = Record<string, Record<string, string[]>>

interface FileOrderStore {
  orders: OrderMap

  getOrder: (workspacePath: string, parentPath: string) => string[] | undefined
  setOrder: (workspacePath: string, parentPath: string, orderedPaths: string[]) => void
  removeWorkspaceOrders: (workspacePath: string) => void
  handlePathRename: (workspacePath: string, oldPath: string, newPath: string) => void
  handlePathDelete: (workspacePath: string, deletedPath: string) => void
}

export const useFileOrderStore = create<FileOrderStore>()(
  persist(
    (set, get) => ({
      orders: {},

      getOrder: (workspacePath, parentPath) => {
        return get().orders[workspacePath]?.[parentPath]
      },

      setOrder: (workspacePath, parentPath, orderedPaths) => {
        set((state) => ({
          orders: {
            ...state.orders,
            [workspacePath]: {
              ...state.orders[workspacePath],
              [parentPath]: orderedPaths
            }
          }
        }))
      },

      removeWorkspaceOrders: (workspacePath) => {
        set((state) => {
          const newOrders = { ...state.orders }
          delete newOrders[workspacePath]
          return { orders: newOrders }
        })
      },

      handlePathRename: (workspacePath, oldPath, newPath) => {
        set((state) => {
          const workspaceOrders = state.orders[workspacePath]
          if (!workspaceOrders) return state

          const newWorkspaceOrders = { ...workspaceOrders }

          const oldParent = getParentPath(oldPath)
          const newParent = getParentPath(newPath)

          if (oldParent === newParent) {
            // Same parent: replace old path with new path in the order list
            if (newWorkspaceOrders[oldParent]) {
              newWorkspaceOrders[oldParent] = newWorkspaceOrders[oldParent].map((p) =>
                p === oldPath ? newPath : p
              )
            }
          } else {
            // Cross-parent move: remove from old parent, add to new parent
            if (newWorkspaceOrders[oldParent]) {
              newWorkspaceOrders[oldParent] = newWorkspaceOrders[oldParent].filter(
                (p) => p !== oldPath
              )
              if (newWorkspaceOrders[oldParent].length === 0) {
                delete newWorkspaceOrders[oldParent]
              }
            }
            if (newWorkspaceOrders[newParent]) {
              newWorkspaceOrders[newParent] = [...newWorkspaceOrders[newParent], newPath]
            }
          }

          // If the renamed item is a folder, update its children's parent key
          if (newWorkspaceOrders[oldPath]) {
            newWorkspaceOrders[newPath] = newWorkspaceOrders[oldPath]
            delete newWorkspaceOrders[oldPath]
          }

          // Update any nested folder keys that start with oldPath/
          const oldPrefix = oldPath + '/'
          for (const key of Object.keys(newWorkspaceOrders)) {
            if (key.startsWith(oldPrefix)) {
              const newKey = newPath + '/' + key.slice(oldPrefix.length)
              newWorkspaceOrders[newKey] = newWorkspaceOrders[key].map((p) =>
                p.startsWith(oldPrefix) ? newPath + '/' + p.slice(oldPrefix.length) : p
              )
              delete newWorkspaceOrders[key]
            }
          }

          // Update child paths within renamed folder's order entries
          if (newWorkspaceOrders[newPath]) {
            newWorkspaceOrders[newPath] = newWorkspaceOrders[newPath].map((p) =>
              p.startsWith(oldPrefix) ? newPath + '/' + p.slice(oldPrefix.length) : p
            )
          }

          return {
            orders: {
              ...state.orders,
              [workspacePath]: newWorkspaceOrders
            }
          }
        })
      },

      handlePathDelete: (workspacePath, deletedPath) => {
        set((state) => {
          const workspaceOrders = state.orders[workspacePath]
          if (!workspaceOrders) return state

          const newWorkspaceOrders = { ...workspaceOrders }

          // Remove from parent's order list
          const parent = getParentPath(deletedPath)
          if (newWorkspaceOrders[parent]) {
            newWorkspaceOrders[parent] = newWorkspaceOrders[parent].filter(
              (p) => p !== deletedPath
            )
            if (newWorkspaceOrders[parent].length === 0) {
              delete newWorkspaceOrders[parent]
            }
          }

          // Remove the folder's own order entry and any nested entries
          delete newWorkspaceOrders[deletedPath]
          const prefix = deletedPath + '/'
          for (const key of Object.keys(newWorkspaceOrders)) {
            if (key.startsWith(prefix)) {
              delete newWorkspaceOrders[key]
            }
          }

          return {
            orders: {
              ...state.orders,
              [workspacePath]: newWorkspaceOrders
            }
          }
        })
      }
    }),
    {
      name: 'file-order-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          return superjson.parse<StorageValue<FileOrderStore>>(str)
        },
        setItem: (name, value) => {
          localStorage.setItem(name, superjson.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      }
    }
  )
)

function getParentPath(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/')
  return lastSlash === -1 ? '' : filePath.substring(0, lastSlash)
}
