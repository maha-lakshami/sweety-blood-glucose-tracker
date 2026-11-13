
import type { Request, Response } from 'express'
import prisma from '../config/prisma'
import { ReadingSlot } from '@prisma/client'

const validSlots = Object.values(ReadingSlot)

const slotNames: Record<string, string> = {
  MORNING: 'Morning',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner'
}

// GET A SINGLE READING ID FROM ROUTE PARAMETERS
const getReadingId = (param: unknown): string | null => {
  if (typeof param === 'string' && param.trim() !== '') {
    return param
  }

  if (
    Array.isArray(param) &&
    typeof param[0] === 'string' &&
    param[0].trim() !== ''
  ) {
    return param[0]
  }

  return null
}

// VALIDATE READING DATE
const validateReadingDate = (date: unknown): Date | null => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null
  }

  const [year, month, day] = date.split('-').map(Number)
  const readingDate = new Date(Date.UTC(year, month - 1, day))

  if (
    readingDate.getUTCFullYear() !== year ||
    readingDate.getUTCMonth() !== month - 1 ||
    readingDate.getUTCDate() !== day
  ) {
    return null
  }

  const today = new Date()
  const todayDate = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ))

  if (readingDate > todayDate) {
    return null
  }

  return readingDate
}

// VALIDATE GLUCOSE VALUE
const validateGlucoseValue = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const glucoseValue = Number(value)

  if (
    !Number.isInteger(glucoseValue) ||
    glucoseValue < 40 ||
    glucoseValue > 600
  ) {
    return null
  }

  return glucoseValue
}

// ADD READING
export const addReading = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { date, slot, value } = req.body

    if (!userId) {
      return res.status(401).json({
        message: 'Please login first.'
      })
    }

    if (value === undefined || value === null || value === '') {
      return res.status(400).json({
        message: 'Please enter a glucose value.'
      })
    }

    const glucoseValue = validateGlucoseValue(value)

    if (glucoseValue === null) {
      return res.status(400).json({
        message: 'Value must be an integer between 40 and 600 mg/dl.'
      })
    }

    const readingDate = validateReadingDate(date)

    if (!readingDate) {
      return res.status(400).json({
        message: 'Please select a valid date that is not in the future.'
      })
    }

    if (!validSlots.includes(slot)) {
      return res.status(400).json({
        message: 'Please select a valid time slot.'
      })
    }

    const existingReading = await prisma.reading.findUnique({
      where: {
        userId_date_slot: {
          userId,
          date: readingDate,
          slot
        }
      }
    })

    if (existingReading) {
      return res.status(409).json({
        message: `You already have an ${slotNames[slot]} reading for this date.`
      })
    }

    const count = await prisma.reading.count({
      where: {
        userId,
        date: readingDate
      }
    })

    if (count >= 4) {
      return res.status(400).json({
        message: 'You can add only 4 readings per day.'
      })
    }

    const reading = await prisma.reading.create({
      data: {
        userId,
        date: readingDate,
        slot,
        value: glucoseValue
      }
    })

    return res.status(201).json({
      message: 'Glucose reading saved successfully.',
      reading
    })

  } catch (error) {
    console.error('Add reading error:', error)

    return res.status(500).json({
      message: 'Unable to save glucose reading.'
    })
  }
}

// GET ALL READINGS
export const getReadings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        message: 'Please login first.'
      })
    }

    const readings = await prisma.reading.findMany({
      where: {
        userId
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return res.json({ readings })

  } catch (error) {
    console.error('Get readings error:', error)

    return res.status(500).json({
      message: 'Unable to retrieve readings.'
    })
  }
}

// UPDATE READING
export const updateReading = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const id = getReadingId(req.params.id)
    const { date, slot, value } = req.body

    if (!userId) {
      return res.status(401).json({
        message: 'Please login first.'
      })
    }

    if (!id) {
      return res.status(400).json({
        message: 'Invalid reading ID.'
      })
    }

    const existingReading = await prisma.reading.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingReading) {
      return res.status(404).json({
        message: 'Reading not found.'
      })
    }

    const readingDate = validateReadingDate(date)

    if (!readingDate) {
      return res.status(400).json({
        message: 'Please select a valid date that is not in the future.'
      })
    }

    const glucoseValue = validateGlucoseValue(value)

    if (glucoseValue === null) {
      return res.status(400).json({
        message: 'Value must be an integer between 40 and 600 mg/dl.'
      })
    }

    if (!validSlots.includes(slot)) {
      return res.status(400).json({
        message: 'Please select a valid time slot.'
      })
    }

    const duplicate = await prisma.reading.findFirst({
      where: {
        userId,
        date: readingDate,
        slot,
        NOT: {
          id
        }
      }
    })

    if (duplicate) {
      return res.status(409).json({
        message: `You already have an ${slotNames[slot]} reading for this date.`
      })
    }

    const count = await prisma.reading.count({
      where: {
        userId,
        date: readingDate,
        NOT: {
          id
        }
      }
    })

    if (count >= 4) {
      return res.status(400).json({
        message: 'You can have only 4 readings per day.'
      })
    }

    const updatedReading = await prisma.reading.update({
      where: {
        id
      },
      data: {
        date: readingDate,
        slot,
        value: glucoseValue
      }
    })

    return res.json({
      message: 'Reading updated successfully.',
      reading: updatedReading
    })

  } catch (error) {
    console.error('Update reading error:', error)

    return res.status(500).json({
      message: 'Unable to update reading.'
    })
  }
}

// DELETE READING
export const deleteReading = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const id = getReadingId(req.params.id)

    if (!userId) {
      return res.status(401).json({
        message: 'Please login first.'
      })
    }

    if (!id) {
      return res.status(400).json({
        message: 'Invalid reading ID.'
      })
    }

    const existingReading = await prisma.reading.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingReading) {
      return res.status(404).json({
        message: 'Reading not found.'
      })
    }

    await prisma.reading.delete({
      where: {
        id
      }
    })

    return res.json({
      message: 'Reading deleted successfully.'
    })

  } catch (error) {
    console.error('Delete reading error:', error)

    return res.status(500).json({
      message: 'Unable to delete reading.'
    })
  }
}
