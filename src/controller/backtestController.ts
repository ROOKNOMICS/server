import { Request, Response } from 'express';
import Backtest from '../models/Backtest.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import handlerResponse from '../index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export const saveBacktest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, symbol, startDate, endDate, capital, activeRules, rulesConfig } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate required fields
    if (!name || !symbol || !startDate || !endDate || !capital || !activeRules) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Run the backtest
    const results = await handlerResponse(symbol, startDate, endDate, capital, activeRules, rulesConfig);

    // Create new backtest document with proper field mapping
    const backtest = new Backtest({
      userId: req.user.id,
      name,
      symbol,
      startDate,
      endDate,
      initialCapital: capital,
      activeRules,
      rulesConfig,
      results: {
         performance: results.performance,
        trades: results.trades,
        verdict: results.verdict,
      },
    });

    await backtest.save();

    res.status(201).json({
      message: 'Backtest saved successfully',
      backtestId: backtest._id,
      results,
    });
  } catch (error) {
    console.error('Error saving backtest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserBacktests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { page = 1, limit = 10, symbol, verdict } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter
    const filter: any = { userId: req.user.id };
    if (symbol && typeof symbol === 'string') filter.symbol = symbol.toUpperCase();
    if (verdict && typeof verdict === 'string') filter['results.verdict.type'] = verdict;

    const backtests = await Backtest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('name symbol startDate endDate initialCapital results.verdict results.benchmark createdAt');

    const total = await Backtest.countDocuments(filter);

    res.status(200).json({
      backtests,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalBacktests: total,
      },
    });
  } catch (error) {
    console.error('Error fetching backtests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBacktestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid backtest ID' });
    }

    const backtest = await Backtest.findOne({ _id: id, userId: req.user.id });

    if (!backtest) {
      return res.status(404).json({ message: 'Backtest not found' });
    }

    res.status(200).json(backtest);
  } catch (error) {
    console.error('Error fetching backtest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBacktest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid backtest ID' });
    }

    const backtest = await Backtest.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!backtest) {
      return res.status(404).json({ message: 'Backtest not found' });
    }

    res.status(200).json({ message: 'Backtest deleted successfully' });
  } catch (error) {
    console.error('Error deleting backtest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware wrapper for authentication
export const withAuth = (handler: Function) => {
  return (req: AuthenticatedRequest, res: Response) => {
    authenticateToken(req, res, () => handler(req, res));
  };
};
