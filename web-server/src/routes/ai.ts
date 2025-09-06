import express from 'express'
import { AIService } from '../../../src/shared/services'
import { config } from '../config/environment'

const router = express.Router()

// Read AI configuration
router.post('/read-config', async (req, res, next) => {
  try {
    const aiConfig = await AIService.readConfig(config.workspacePath)
    res.json(aiConfig)
  } catch (error) {
    next(error)
  }
})

// Write AI configuration
router.post('/write-config', async (req, res, next) => {
  try {
    const { config: aiConfig } = req.body
    await AIService.writeConfig(config.workspacePath, aiConfig)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Set AI API key
router.post('/set-ai-key', async (req, res, next) => {
  try {
    const { apiKey } = req.body
    // For web version, store API key in environment or secure storage
    // This is a simplified implementation
    process.env.AI_API_KEY = apiKey
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Save chat session
router.post('/save-session', async (req, res, next) => {
  try {
    const { session } = req.body
    await AIService.saveChatSession(config.workspacePath, session)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Load chat sessions list
router.get('/load-sessions', async (req, res, next) => {
  try {
    const sessions = await AIService.loadChatSessions(config.workspacePath)
    res.json(sessions)
  } catch (error) {
    next(error)
  }
})

// Load specific chat session
router.post('/load-session', async (req, res, next) => {
  try {
    const { sessionId } = req.body
    const session = await AIService.loadChatSession(config.workspacePath, sessionId)
    res.json(session)
  } catch (error) {
    next(error)
  }
})

// Delete chat session
router.post('/delete-session', async (req, res, next) => {
  try {
    const { sessionId } = req.body
    await AIService.deleteChatSession(config.workspacePath, sessionId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Validate AI model
router.post('/validate-model', async (req, res, next) => {
  try {
    const { model } = req.body
    const validation = AIService.validateModel(model)
    res.json(validation)
  } catch (error) {
    next(error)
  }
})

// Stream chat with AI
router.post('/stream-chat', async (req, res, next) => {
  try {
    const { model, messages, options } = req.body
    
    // Validate model configuration
    const validation = AIService.validateModel(model)
    if (!validation.isValid) {
      console.error('Model validation failed:', validation.error)
      return res.status(400).json({ error: validation.error })
    }

    // Get streaming response from AIService
    const streamResponse = await AIService.streamChatForWeb(model, messages, options)
    
    // Express cannot directly return Response objects
    // Use `pipeTo()` to stream Response.body to Express response
    streamResponse.body.pipeTo(new WritableStream({
      write(chunk) {
        res.write(chunk)
      },
      close() {
        res.end()
      }
    }))
    
  } catch (error) {
    console.error('Stream chat error:', error)
    next(error)
  }
})

export default router