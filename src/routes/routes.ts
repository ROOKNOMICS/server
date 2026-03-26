import express from 'express'
import dotenv from 'dotenv';
import backtestController from '../controller/data.controller.js'
import { GET } from '../api/prices.js'
import cors from 'cors'
import connectDB from '../config/db.js';
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express()
connectDB();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CLIENT_URL ||'http://localhost:8080',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}

app.use(cors(corsOptions))
app.options('/backtest', cors(corsOptions))
app.options('/api/prices', cors(corsOptions))
app.use(express.json());
app.post('/backtest', backtestController)

app.get('/api/prices', GET)

app.use('/api/auth', authRoutes);

app.listen(PORT,()=>{
  console.log(`listening @ ${PORT}`)
})
