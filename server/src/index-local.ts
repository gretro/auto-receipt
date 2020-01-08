import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as morgan from 'morgan'
import { paypalIpn } from './functions/http/paypal-ipn'
import { createCheque } from './functions/http/create-cheque-donation'
import { listDonations } from './functions/http/donation-management'
import { logger } from './utils/logging'
import { subscribe, publishMessage } from './pubsub/service'
import { pdf, GeneratePdfCommand } from './functions/pubsub/pdf'

const app = express()

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/paypalIpn', paypalIpn)
app.all('/createCheque', createCheque)
app.all('/listDonations', listDonations)

async function main(): Promise<void> {
  app.listen(3000, () => {
    logger.info('Listening on port 3000')
  })

  await subscribe({
    pdf,
  })

  // TODO: Remove
  let i = 1
  setInterval(() => {
    const command: GeneratePdfCommand = {
      message: `Hello! This is message #${i++}`,
    }

    publishMessage(command, 'pdf')
  }, 2000)
}

main().catch(err => {
  logger.error('Error while running server', err)
  process.exit(1)
})
