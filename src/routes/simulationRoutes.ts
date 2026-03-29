import { Router } from 'express';
import {
  saveSimulation,
  getAllSimulations,
  getSimulation,
  deleteSimulation,
} from '../controller/simulationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', saveSimulation);
router.get('/', getAllSimulations);
router.get('/:id', getSimulation);
router.delete('/:id', deleteSimulation);

export default router;
