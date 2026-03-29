import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Simulation from '../models/Simulation.js';

// POST /api/simulations
export const saveSimulation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const { strategy, performance, trades, verdict } = req.body;

    if (!strategy || !performance || !trades || !verdict) {
      res.status(400).json({ message: 'strategy, performance, trades, and verdict are required' });
      return;
    }

    const simulation = await Simulation.create({
      userId,
      strategy,
      performance,
      trades,
      verdict,
    });

    res.status(201).json({ simulation });
  } catch (error) {
    console.error('Save simulation error:', error);
    res.status(500).json({ message: 'Server error saving simulation' });
  }
};

// GET /api/simulations
export const getAllSimulations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;

    const simulations = await Simulation.find({ userId })
      .select('strategy performance verdict createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ simulations });
  } catch (error) {
    console.error('Get simulations error:', error);
    res.status(500).json({ message: 'Server error fetching simulations' });
  }
};

// GET /api/simulations/:id
export const getSimulation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const id = req.params['id'] as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid simulation ID' });
      return;
    }

    const oid = new mongoose.Types.ObjectId(id);
    const simulation = await Simulation.findOne({ _id: oid, userId });

    if (!simulation) {
      res.status(404).json({ message: 'Simulation not found' });
      return;
    }

    res.status(200).json({ simulation });
  } catch (error) {
    console.error('Get simulation error:', error);
    res.status(500).json({ message: 'Server error fetching simulation' });
  }
};

// DELETE /api/simulations/:id
export const deleteSimulation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const id = req.params['id'] as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid simulation ID' });
      return;
    }

    const oid = new mongoose.Types.ObjectId(id);
    const simulation = await Simulation.findOneAndDelete({ _id: oid, userId });

    if (!simulation) {
      res.status(404).json({ message: 'Simulation not found' });
      return;
    }

    res.status(200).json({ message: 'Simulation deleted' });
  } catch (error) {
    console.error('Delete simulation error:', error);
    res.status(500).json({ message: 'Server error deleting simulation' });
  }
};
