import * as Joi from 'joi'
import { addressSchema } from '../../models/Address'
import { DeepPartial } from '../../models/DeepPartial'
import { Donation } from '../../models/Donation'
import { Donor } from '../../models/Donor'
import { donationsService } from '../../services/donation-service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withApiToken,
} from '../../utils/http'

const patchDonationSchema = Joi.object<Donation>({
  id: Joi.string().required(),
  externalId: Joi.forbidden(),
  created: Joi.forbidden(),
  fiscalYear: Joi.number().optional(),
  type: Joi.forbidden(),
  donor: Joi.object<Donor>({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().optional(),
    address: addressSchema.optional(),
  }).optional(),
  payments: Joi.forbidden(),
  emailReceipt: Joi.boolean().optional(),
  documentIds: Joi.forbidden(),
  documents: Joi.forbidden(),
  correspondences: Joi.forbidden(),
  reason: Joi.string().optional(),
})

export const patchDonation = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
  allowMethods('PATCH'),
  validateBody(patchDonationSchema)
)(
  async (req, res): Promise<void> => {
    const donationPatch: DeepPartial<Donation> = req.body
    if (!donationPatch || !donationPatch.id) {
      res.sendStatus(400)
      return
    }

    const patchedDonation = await donationsService.patchDonation(
      donationPatch.id,
      donationPatch
    )

    res.status(200).send(patchedDonation)
  }
)
