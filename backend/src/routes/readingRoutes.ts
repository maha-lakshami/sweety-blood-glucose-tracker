
import { Router } from 'express'

import {
  addReading,
  getReadings,
  updateReading,
  deleteReading
} from '../controllers/readingController'

import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

router.use(authMiddleware)

router.post('/', addReading)
router.get('/', getReadings)
router.put('/:id', updateReading)
router.delete('/:id', deleteReading)

export default router
