import * as functions from 'firebase-functions'
import PayPalIpn from 'paypal-ipn-types'
import * as rp from 'request-promise'

/**
 * Verify the payload recieved with PayPal to ensure that it is an authentic message
 * 
 * @param ipnData The payload received for PayPal IPN via the webhook
 * @returns {Promise<boolean>} true if message is valid and can be processed, false if fake
 *  
 * TODO: use the functions.config() to either point to sandbox.paypal.com for test purposes or ipnpb.paypal.com for live
 */
async function isValid(ipnData: PayPalIpn): Promise<boolean> {
  const validationResponse = await rp({
    method: 'POST',
    uri: 'https://ipnpb.paypal.com/cgi-bin/webscr', // functions.config().paypal.ipn_url,
    formData: {
      cmd:'_notify-validate',
      ...ipnData
    }
  })
  return validationResponse === 'VERIFIED' // other return is INVALID. If it is INVALID it is probably spoofed
}

export const paypalIPN = functions.https.onRequest(async (request, reply) => {
  const ipnData = request.body as PayPalIpn
  const valid = await isValid(ipnData)
  if (valid) {
    switch(ipnData.txn_type) {
      case 'recurring_payment': {

      }
      break;
      case 'web_accept': {
        // generate receipt
      }
      break;
      default: {
        console.log(`received transaction of type ${ipnData.txn_type} and did not have an action to take`)
      }
    }
    reply.sendStatus(200)
  } else {
    console.error('IPN verification failed')
    console.error(ipnData)
  }
})