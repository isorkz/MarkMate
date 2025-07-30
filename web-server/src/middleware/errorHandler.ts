import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', error.message)
  
  res.status(500).json({
    error: error.message
  })
}