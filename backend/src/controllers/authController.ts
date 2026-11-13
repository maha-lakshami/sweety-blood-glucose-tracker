
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma'


const JWT_SECRET = process.env.JWT_SECRET

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' ||
      typeof password !== 'string' || password.length < 6
    ) {
      return res.status(400).json({
        message: 'Please provide a valid name, email and password of at least 6 characters.'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return res.status(201).json({
      message: 'Account created successfully.',
      user
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({
      message: 'Unable to create account.'
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() || !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required.'
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      })
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        message: 'Authentication configuration error.'
      })
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      message: 'Unable to login.'
    })
  }
}
