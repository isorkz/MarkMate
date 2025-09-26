import { createOpenAI } from '@ai-sdk/openai'
import { NoOutputGeneratedError, streamText } from 'ai'
import { AIModel, ChatMessage, AIOptions } from '../types/ai'
import { DEFAULT_TEMPERATURE } from '../constants/ai'

export class AIChatService {
  /**
   * Validate AI model configuration
   */
  static validateModel(model: AIModel): { isValid: boolean; error?: string } {
    if (!model.apiKey) {
      return { isValid: false, error: 'API key is required' }
    }

    if (!model.model) {
      return { isValid: false, error: 'Model name is required' }
    }

    return { isValid: true }
  }

  /**
   * Stream chat with callback and cancellation support
   */
  static async streamChat(
    model: AIModel,
    messages: ChatMessage[],
    options: AIOptions,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    onAbort: () => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      // Create AI provider and model instance
      let aiProvider
      
      switch (model.provider) {
        case 'openai':
          aiProvider = createOpenAI({
            apiKey: model.apiKey,
            ...(model.baseURL && { baseURL: model.baseURL })
          })
          break
        default:
          throw new Error(`Unsupported provider: ${model.provider}`)
      }
      
      const aiModel = aiProvider.chat(model.model)

      // Format messages for AI SDK
      const formattedMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }))

      // https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
      // https://ai-sdk.dev/cookbook/node/stream-text
      const result = await streamText({
        model: aiModel,
        messages: formattedMessages,
        temperature: options.temperature || DEFAULT_TEMPERATURE,
        abortSignal,
        onChunk: (event) => {
          if (event.chunk.type === 'text-delta') {
            onChunk(event.chunk.text)
          }
        },
        onFinish: () => {
          onComplete()
        },
        onError: (errorEvent) => {
          console.error('streamChat() onError called:', errorEvent)
          const errorMessage = errorEvent.error instanceof Error 
            ? errorEvent.error.message 
            : 'Unknown error'
          onError(errorMessage)
        },
        onAbort: () => {
          onAbort()
        }
      })

      // Wait for the stream to complete
      await result.finishReason
      
    } catch (error) {
      // Check if it's an abort-related error (user cancellation)
      if (NoOutputGeneratedError.isInstance(error)) {
        // console.log('Stream was aborted by user')
        return
      }

      console.error('Error in AI chat stream:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onError(errorMessage)
    }
  }
}