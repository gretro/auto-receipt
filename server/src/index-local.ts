import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as morgan from 'morgan'
import { paypalIpn } from './functions/paypal-ipn'
import { createCheque } from './functions/create-cheque-donation'
import { listDonations } from './functions/donation-management'

var my_name = 'gab2'

const app = express()

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/paypalIpn', paypalIpn)
app.all('/createCheque', createCheque)
app.all('/listDonations', listDonations)

app.listen(3000, () => {
  console.log('Listening on port 3000')
})
