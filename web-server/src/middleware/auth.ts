import { Request, Response, NextFunction } from 'express'
import { config } from '../config/environment'

export const tokenAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token || token !== config.accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing access token' })
  }
  
  next()
}