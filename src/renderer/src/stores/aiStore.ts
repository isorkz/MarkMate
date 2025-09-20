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
  deleteSession: (id: string) => Promise<void>
  clearCurrentSession: () => Promise<void>
  copyCurrentSession: () => Promise<void>

  // Chat actions
  addMessage: (role: MessageRole, content: string) => Promise<ChatMessage>
  updateMessage: (id: string, content: string, persist?: boolean) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  eraseFromMessage: (id: string) => Promise<void>
  sendChat: (content: string, model: AIModel) => Promise<void>
  regenerateChat: (id: string, model: AIModel) => Promise<void>
  cancelStreamChat: () => void
}

const createEmptyChatSession = (): ChatSession => ({
  id: createChatSessionId(),
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

const createChatSessionId = (): string => `session-${Date.now()}`

// Private helper function for streaming chat
const streamChat = async (
  model: AIModel,
  messages: ChatMessage[],
  options: AIOptions,
  assistantMessageId: string,
  get: () => AIStore,
  set: (state: Partial<AIStore> | ((state: AIStore) => Partial<AIStore>)) => void
) => {
  // Set streaming state
  const abortController = new AbortController()
  set({
    isStreaming: true,
    streamingMessageId: assistantMessageId,
    isCancelling: false,
    abortController: abortController,
    error: null    // Clear previous error
  })
  
  // Stream AI response
  let fullResponse = ''
  
  try {
    await AIChatService.streamChat(
      model,
      messages,
      options,
      (chunk: string) => {
        fullResponse += chunk
        get().updateMessage(assistantMessageId, fullResponse, false)
      },
      () => {
        // Handle completion
        // Update session title if it's the first message pair
        const session = get().currentSession
        if (session && session.messages.length >= 2 && session.title === DEFAULT_CHAT_TITLE) {
          const userMessage = session.messages.find(msg => msg.role === 'user')
          if (userMessage) {
            const content = userMessage.content as string
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
        }
        
        // Final persist after streaming is complete
        get().updateMessage(assistantMessageId, fullResponse, true)
      },
      (error: string) => {
        // Handle error
        set({ error })
      },
      () => {
        // Handle abort
        const cancelledResponse = fullResponse + '\n\n*(cancelled)*'
        get().updateMessage(assistantMessageId, cancelledResponse, true)
      },
      abortController.signal
    )
  } finally {
    // Reset streaming state
    set({
      isStreaming: false,
      streamingMessageId: null,
      isCancelling: false,
      abortController: null
    })
  }
}

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

  // Copy current session
  copyCurrentSession: async () => {
    const state = get()
    if (!state.currentSession || state.currentSession.messages.length === 0) {
      return
    }

    const workspacePath = useWorkspaceStore.getState().currentWorkspace?.path
    if (!workspacePath) return

    // Create a copy of the current session with new ID
    const copiedSession: ChatSession = {
      ...state.currentSession,
      id: createChatSessionId(),
      title: `${state.currentSession.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [...state.currentSession.messages] // Deep copy messages
    }

    // Save the copied session to file
    await adapters.aiAdapter.saveChatSession(workspacePath, copiedSession)

    // Add to sessions list and set as current
    const { messages, ...sessionInfo } = copiedSession
    set(state => ({
      currentSession: copiedSession,
      activeSessionId: copiedSession.id,
      sessions: [sessionInfo, ...state.sessions]
    }))
  },

  // Add a message to current session
  addMessage: async (role: MessageRole, content: string): Promise<ChatMessage> => {
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
    await saveCurrentSession(updatedSession)
    
    return message
  },

  // Update a message content
  updateMessage: async (id: string, content: string, persist: boolean = true) => {
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
        await saveCurrentSession(state.currentSession)
      }
    }
  },

  // Delete a message
  deleteMessage: async (id: string) => {
    set(state => {
      if (!state.currentSession) return state
      
      const updatedMessages = state.currentSession.messages.filter(msg => msg.id !== id)
      
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
    
    // Save session after deleting message
    const state = get()
    if (state.currentSession) {
      await saveCurrentSession(state.currentSession)
    }
  },

  // Erase current message and all following messages
  eraseFromMessage: async (id: string) => {
    set(state => {
      if (!state.currentSession) return state
      
      const messages = state.currentSession.messages
      const targetIndex = messages.findIndex(msg => msg.id === id)
      
      if (targetIndex === -1) return state
      
      // Keep only messages before the target message
      const updatedMessages = messages.slice(0, targetIndex)
      
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
    
    // Save session after erasing messages
    const state = get()
    if (state.currentSession) {
      await saveCurrentSession(state.currentSession)
    }
  },

  // Send a message and get AI response
  sendChat: async (content: string, model: AIModel) => {
    // Validate model configuration
    const validation = AIChatService.validateModel(model)
    if (!validation.isValid) {
      set({ error: validation.error })
      return
    }

    const { addMessage, createNewSession } = get()
    let { currentSession, config } = get()
    
    // Create a new session if none exists
    if (!currentSession) {
      await createNewSession()
      currentSession = get().currentSession
    }
    
    try {
      // Add user message
      await addMessage('user', content)
      
      // Create empty assistant message for streaming
      const assistantMessage = await addMessage('assistant', '')
      
      // Get all messages for context (refresh after adding messages)
      const messages = get().currentSession?.messages || []

      // Stream AI response
      await streamChat(model, messages, config.options, assistantMessage.id, get, set)

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      set({ error: errorMessage })
    }
  },

  // Regenerate message - replace target message with new AI response
  // For user message: find next assistant message and replace it
  // For assistant message: find previous user message and regenerate current assistant message
  // Only replaces the specific target message, does not affect subsequent messages in the conversation
  regenerateChat: async (id: string, model: AIModel) => {
    const state = get()
    if (!state.currentSession) return
    
    const messages = state.currentSession.messages
    const messageIndex = messages.findIndex(msg => msg.id === id)
    
    if (messageIndex === -1) return
    
    const targetMessage = messages[messageIndex]
    let userMessageContent = ''
    let assistantMessageId = ''
    
    if (targetMessage.role === 'user') {
      // User message regenerate: find the next assistant message to replace
      userMessageContent = targetMessage.content as string
      
      // Find the next assistant message after this user message
      for (let i = messageIndex + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          assistantMessageId = messages[i].id
          break
        }
      }
    } else if (targetMessage.role === 'assistant') {
      // Assistant message regenerate: find the corresponding user message
      assistantMessageId = targetMessage.id
      
      // Find the previous user message
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessageContent = messages[i].content as string
          break
        }
      }
    }
    
    if (!userMessageContent) return
    
    // If no assistant message to replace, create a new one
    if (!assistantMessageId) {
      const assistantMessage = await get().addMessage('assistant', '')
      assistantMessageId = assistantMessage.id
    } else {
      // Clear existing assistant message content
      await get().updateMessage(assistantMessageId, '', false)
    }
    
    // Get all messages up to the target message for context
    const contextMessages = messages.slice(0, messageIndex + (targetMessage.role === 'user' ? 1 : 0))
    
    // Stream the response
    await streamChat(model, contextMessages, state.config.options, assistantMessageId, get, set)
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