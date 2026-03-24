import express from 'express'
import backtestController from '../controller/data.controller.js'
import { GET } from '../api/prices.js'
const app = express()
app.use(express.json());
app.post('/backtest', backtestController)

app.get('/api/prices', GET)

app.listen(3000,()=>{
  console.log('listening @ 3000')
})