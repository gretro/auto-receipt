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
  withAuth,
  withCORS,
} from '../../utils/http'

interface PatchDonationViewModel {
  donation: DeepPartial<Donation>
  generateReceipt: boolean
}

const patchDonationSchema = Joi.object<PatchDonationViewModel>({
  donation: Joi.object<Donation>({
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
  }).required(),
  generateReceipt: Joi.boolean().required(),
})

export const patchDonation = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('PATCH'),
  validateBody(patchDonationSchema)
)(
  async (req, res): Promise<void> => {
    const donationPatch: PatchDonationViewModel = req.body
    if (!donationPatch || !donationPatch.donation?.id) {
      res.sendStatus(400)
      return
    }

    const patchedDonation = await donationsService.patchDonation(
      donationPatch.donation.id,
      donationPatch.donation,
      donationPatch.generateReceipt
    )

    res.status(200).send(patchedDonation)
  }
)
