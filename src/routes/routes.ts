import express from 'express'
import dotenv from 'dotenv';
import backtestController from '../controller/data.controller.js'
import { GET } from '../api/prices.js'
import cors, { CorsOptions } from 'cors';
import connectDB from '../config/db.js';
import authRoutes from './authRoutes.js';
import cookieParser from 'cookie-parser';
import { saveBacktest, getUserBacktests, getBacktestById, deleteBacktest, withAuth } from '../controller/backtestController.js';

dotenv.config();

const app = express()
connectDB();
const PORT = process.env.PORT || 3000;



const allowedOrigins = [
  'http://localhost:8080',
  'https://rooknomics.vercel.app'
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
};

app.use(cors(corsOptions))
app.use(cookieParser());  
app.options('/backtest', cors(corsOptions))
app.options('/api/prices', cors(corsOptions))
app.options('/api/backtests', cors(corsOptions))
app.use(express.json());
app.post('/backtest', backtestController)

app.get('/api/prices', GET)

// Backtest management routes
app.post('/api/backtests', withAuth(saveBacktest));
app.get('/api/backtests', withAuth(getUserBacktests));
app.get('/api/backtests/:id', withAuth(getBacktestById));
app.delete('/api/backtests/:id', withAuth(deleteBacktest));

app.use('/api/auth', authRoutes);

app.listen(PORT,()=>{
  console.log(`listening @ ${PORT}`)
})
