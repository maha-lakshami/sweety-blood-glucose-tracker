
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
      }
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required.'
      })
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        message: 'Authentication configuration error.'
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        message: 'Invalid authentication token.'
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
    }

    req.user = {
      userId: decoded.userId
    }

    next()

  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.'
    })
  }
}
