import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as morgan from 'morgan'
import { paypalWebhook } from './functions/paypal'
import { createCheque } from './functions/create-cheque-donation'
import { listDonations } from './functions/donation-management'

const app = express()
app.use(morgan('dev'))
app.use(bodyParser.json())

app.all('/paypalWebhook', paypalWebhook)
app.all('/createCheque', createCheque)
app.all('/listDonations', listDonations)

app.listen(3000, () => {
  console.log('Listening on port 3000')
})
