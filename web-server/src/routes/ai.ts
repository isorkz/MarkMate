import express from 'express'
import { AIPersistService } from '../../../src/shared/services'
import { config } from '../config/environment'

const router = express.Router()

// Read AI configuration
router.post('/read-config', async (req, res, next) => {
  try {
    const aiConfig = await AIPersistService.readConfig(config.workspacePath)
    res.json(aiConfig)
  } catch (error) {
    next(error)
  }
})

// Write AI configuration
router.post('/write-config', async (req, res, next) => {
  try {
    const { config: aiConfig } = req.body
    await AIPersistService.writeConfig(config.workspacePath, aiConfig)
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
    await AIPersistService.saveChatSession(config.workspacePath, session)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Load chat sessions list
router.get('/load-sessions', async (req, res, next) => {
  try {
    const sessions = await AIPersistService.loadChatSessions(config.workspacePath)
    res.json(sessions)
  } catch (error) {
    next(error)
  }
})

// Load specific chat session
router.post('/load-session', async (req, res, next) => {
  try {
    const { sessionId } = req.body
    const session = await AIPersistService.loadChatSession(config.workspacePath, sessionId)
    res.json(session)
  } catch (error) {
    next(error)
  }
})

// Delete chat session
router.post('/delete-session', async (req, res, next) => {
  try {
    const { sessionId } = req.body
    await AIPersistService.deleteChatSession(config.workspacePath, sessionId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router