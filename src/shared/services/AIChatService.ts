import { createOpenAI } from '@ai-sdk/openai'
import { createAzure } from '@ai-sdk/azure'
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

    if (model.provider === 'azure' && !model.baseURL) {
      return { isValid: false, error: 'Base URL is required for Azure OpenAI' }
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
        case 'azure':
          // https://ai-sdk.dev/providers/ai-sdk-providers/azure
          if (!model.baseURL) {
            throw new Error('Base URL is required for Azure OpenAI')
          }
          // Extract resource name from baseURL
          const resourceMatch = model.baseURL.match(/https:\/\/(.*?)\.openai\.azure\.com/)
          if (!resourceMatch) {
            throw new Error('Invalid Azure OpenAI baseURL format')
          }
          aiProvider = createAzure({
            resourceName: resourceMatch[1],
            apiKey: model.apiKey,
            // apiVersion: '2025-04-01-preview'  // https://learn.microsoft.com/en-us/azure/ai-foundry/openai/api-version-lifecycle?tabs=key
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