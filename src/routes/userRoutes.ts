import { Router } from 'express';
import { getUserStats } from '../controller/simulationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/stats', getUserStats);

export default router;
