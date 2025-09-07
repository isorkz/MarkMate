import { create } from 'zustand'
import { AIModel, AIConfig, AIOptions, ChatMessage, ChatSession, MessageRole, ChatSessionInfo } from '../../../shared/types/ai'
import { DEFAULT_AI_CONFIG, DEFAULT_CHAT_TITLE } from '../../../shared/constants/ai'
import { AIChatService } from '../../../shared/services/AIChatService'
import { adapters } from '../adapters'
import { persistAIConfig, saveCurrentSession } from '../utils/aiPersistHelper'
import { useWorkspaceStore } from './workspaceStore'

interface AIStore {
  // Error state
  error: string | null
  clearError: () => void

  // Config state
  config: AIConfig

  // Configuration actions
  addModel: (model: Omit<AIModel, 'id'>) => Promise<void>
  updateModel: (id: string, model: Partial<AIModel>) => Promise<void>
  deleteModel: (id: string) => Promise<void>
  setDefaultModel: (id: string) => Promise<void>
  updateModelOptions: (options: Partial<AIOptions>) => Promise<void>

  // Chat state
  sessions: ChatSessionInfo[]
  currentSession: ChatSession
  activeSessionId: string | null  // null means draft session
  isStreaming: boolean
  streamingMessageId: string | null
  isCancelling: boolean
  abortController: AbortController | null
  
  // Session management
  loadSessions: () => Promise<void>
  createNewSession: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  clearCurrentSession: () => Promise<void>
  deleteSession: (id: string) => Promise<void>

  // Chat actions
  addMessage: (role: MessageRole, content: string) => ChatMessage
  updateMessage: (id: string, content: string, persist?: boolean) => void
  streamChat: (content: string, model: AIModel) => Promise<void>
  cancelStreamChat: () => void
}

const createEmptyChatSession = (): ChatSession => ({
  id: `session-${Date.now()}`,
  title: DEFAULT_CHAT_TITLE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: []
})

const createChatMessage = (role: MessageRole, content: string): ChatMessage => ({
  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  role,
  content,
  timestamp: new Date().toISOString()
})

const createModelId = (): string => `model-${Date.now()}`

export const useAIStore = create<AIStore>((set, get) => ({
  // Initial state
  config: DEFAULT_AI_CONFIG,
  error: null,
  
  // Chat state
  sessions: [],
  currentSession: createEmptyChatSession(),
  activeSessionId: null,
  isStreaming: false,
  streamingMessageId: null,
  isCancelling: false,
  abortController: null,
  
  // Clear error
  clearError: () => set({ error: null }),

  // Add a new AI model
  addModel: async (model) => {
    const state = get()
    const newModel: AIModel = {
      ...model,
      id: createModelId()
    }
    
    const updatedModels = [...state.config.models, newModel]
    const updatedCurrentModelId = state.config.models.length === 0 ? newModel.id : state.config.currentModelId
    
    const updatedConfig = {
      ...state.config,
      models: updatedModels,
      currentModelId: updatedCurrentModelId
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await persistAIConfig(updatedConfig, updatedCurrentModelId !== state.config.currentModelId)
  },
  
  // Update an existing AI model
  updateModel: async (id, modelUpdate) => {
    const state = get()
    const updatedModels = state.config.models.map(model => 
      model.id === id ? { ...model, ...modelUpdate } : model
    )
    
    const updatedConfig = {
      ...state.config,
      models: updatedModels
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await persistAIConfig(updatedConfig, id === state.config.currentModelId)
  },
  
  // Delete an AI model
  deleteModel: async (id) => {
    const state = get()
    const updatedModels = state.config.models.filter(model => model.id !== id)
    let updatedCurrentModelId = state.config.currentModelId
    
    // If deleting current model, set first remaining model as current
    if (updatedCurrentModelId === id) {
      updatedCurrentModelId = updatedModels.length > 0 ? updatedModels[0].id : null
    }
    
    const updatedConfig = {
      ...state.config,
      models: updatedModels,
      currentModelId: updatedCurrentModelId
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await persistAIConfig(updatedConfig, updatedCurrentModelId !== state.config.currentModelId)
  },
  
  // Set default model
  setDefaultModel: async (id) => {
    const state = get()
    const updatedConfig = {
      ...state.config,
      currentModelId: id
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await persistAIConfig(updatedConfig, true)
  },
  
  // Update AI options (temperature, maxTokens)
  updateModelOptions: async (optionUpdates) => {
    const state = get()
    const updatedOptions = { ...state.config.options, ...optionUpdates }
    const updatedConfig = {
      ...state.config,
      options: updatedOptions
    }
    
    set({ config: updatedConfig })
    
    // Save to config file
    await persistAIConfig(updatedConfig, false)
  },

  // Create a new draft session (only in memory)
  createNewSession: async () => {
    const state = get()
    
    // If already in draft mode with empty session, do nothing
    if (state.activeSessionId === null) {
      return
    }
    
    // Create new draft session
    set({
      currentSession: createEmptyChatSession(),
      activeSessionId: null
    })
  },

  // Load an existing session
  loadSession: async (id: string) => {
    try {
      const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
      if (!workspacePath) return
      
      const session = await adapters.aiAdapter.loadChatSession(workspacePath, id)
      if (session) {
        set({ 
          currentSession: session,
          activeSessionId: id
        })
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  },

  // Load all sessions list
  loadSessions: async () => {
    try {
      const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
      if (!workspacePath) return
      
      const sessions = await adapters.aiAdapter.loadChatSessions(workspacePath)
      set({ sessions })
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  },

  // Clear current session messages
  clearCurrentSession: async () => {
    const state = get()
    
    if (state.activeSessionId === null) {
      // If draft session, just reset it
      set({
        currentSession: createEmptyChatSession(),
        activeSessionId: null
      })
    } else {
      // If saved session, delete it and create new draft
      await get().deleteSession(state.activeSessionId)
    }
  },

  // Delete a saved session
  deleteSession: async (id: string) => {
    try {
      const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
      if (!workspacePath) return
      
      await adapters.aiAdapter.deleteChatSession(workspacePath, id)
      
      // Update local state
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== id),
        currentSession: state.activeSessionId === id ? createEmptyChatSession() : state.currentSession,
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
      }))
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  },

  // Add a message to current session
  addMessage: (role: MessageRole, content: string): ChatMessage => {
    const message = createChatMessage(role, content)

    const state = get()
    const updatedSession = {
      ...state.currentSession,
      messages: [...state.currentSession.messages, message],
      updatedAt: new Date().toISOString()
    }

    // If this is a draft session (activeSessionId is null), convert to saved
    if (state.activeSessionId === null) {
      const { messages, ...sessionInfo } = updatedSession

      set({
        currentSession: updatedSession,
        activeSessionId: updatedSession.id,
        sessions: [sessionInfo, ...state.sessions]
      })
    } else {
      // Update 'updatedAt' of existing session info
      set({
        currentSession: updatedSession,
        sessions: state.sessions.map(s => 
          s.id === updatedSession.id ? {
            ...s,
            updatedAt: updatedSession.updatedAt
          } : s
        )
      })
    }
    
    // Auto-save session after adding message
    setTimeout(() => saveCurrentSession(updatedSession), 100)
    
    return message
  },

  // Update a message content
  updateMessage: (id: string, content: string, persist: boolean = true) => {
    set(state => {
      if (!state.currentSession) return state
      
      const updatedMessages = state.currentSession.messages.map(msg => {
        if (msg.id === id) {
          return {
            ...msg,
            content
          }
        }
        return msg
      })
      
      const updatedSession = {
        ...state.currentSession,
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      }
      
      return {
        currentSession: updatedSession,
        sessions: state.sessions.map(s => 
          s.id === updatedSession.id ? {
            ...s,
            updatedAt: updatedSession.updatedAt
          } : s
        )
      }
    })
    
    // Conditionally save session
    if (persist) {
      const state = get()
      if (state.currentSession) {
        const session = state.currentSession
        setTimeout(() => saveCurrentSession(session), 100)
      }
    }
  },

  // Send a message and get AI response
  streamChat: async (content: string, model: AIModel) => {
    // Validate model configuration
    const validation = AIChatService.validateModel(model)
    if (!validation.isValid) {
      set({ error: validation.error })
      return
    }

    const { addMessage, updateMessage, createNewSession } = get()
    let { currentSession, config } = get()
    
    // Create a new session if none exists
    if (!currentSession) {
      await createNewSession()
      currentSession = get().currentSession
    }
    
    try {
      // Add user message
      addMessage('user', content)
      
      // Create empty assistant message for streaming
      const assistantMessage = addMessage('assistant', '')
      
      // Set streaming state
      const abortController = new AbortController()
      set({
        isStreaming: true,
        streamingMessageId: assistantMessage.id,
        isCancelling: false,
        abortController: abortController,
        error: null   // Clear previous error
      })
      
      // Stream AI response
      let fullResponse = ''

      // Get all messages for context (refresh after adding messages)
      const messages = get().currentSession?.messages || []

      await AIChatService.streamChat(
        model, 
        messages, 
        config.options,
        (chunk: string) => {
          // Handle chunk
          fullResponse += chunk
          updateMessage(assistantMessage.id, fullResponse, false)
        },
        () => {
          // Handle completion
          // Update session title if it's the first message pair
          const session = get().currentSession
          if (session && session.messages.length >= 2 && session.title === DEFAULT_CHAT_TITLE) {
            const updatedSession = {
              ...session,
              title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
            }
            
            set({
              currentSession: updatedSession,
              sessions: get().sessions.map(s => 
                s.id === updatedSession.id ? updatedSession : s
              )
            })
          }
          
          // Final persist after streaming is complete
          updateMessage(assistantMessage.id, fullResponse, true)
        },
        (error: string) => {
          // Handle error
          set({ error })
        },
        () => {
          // Handle abort
          const cancelledResponse = fullResponse + '\n\n*(cancelled)*'
          updateMessage(assistantMessage.id, cancelledResponse, true)
        },
        abortController.signal
      )

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      set({ error: errorMessage })
    } finally {
      // Reset streaming state
      set({
        isStreaming: false,
        streamingMessageId: null,
        isCancelling: false,
        abortController: null
      })
    }
  },

  // Cancel current streaming
  cancelStreamChat: () => {
    const state = get()
    if (state.abortController && state.streamingMessageId) {
      set({ isCancelling: true })
      state.abortController.abort()
    }
  }
}))