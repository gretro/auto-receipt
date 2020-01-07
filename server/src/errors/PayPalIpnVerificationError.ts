import PayPalIpn from 'paypal-ipn-types'

export class PayPalIpnVerificationError extends Error {
  constructor(public ipnData: PayPalIpn) {
    super(`Could not validate PayPal IPN`)
    Error.captureStackTrace(this, PayPalIpnVerificationError)
  }
}
