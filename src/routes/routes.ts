import express from 'express'
import backtestController from '../controller/data.controller.js'
import { GET } from '../api/prices.js'
import cors from 'cors'
const app = express()

const corsOptions = {
  origin: 'http://localhost:8080',
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

app.listen(3000,()=>{
  console.log('listening @ 3000')
})
