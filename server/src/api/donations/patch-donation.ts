import { RequestHandler } from 'express'
import Joi from 'joi'
import { addressSchema } from '../../models/Address'
import { DeepPartial } from '../../models/DeepPartial'
import { Donation } from '../../models/Donation'
import { Donor } from '../../models/Donor'
import { donationsService } from '../../services/donation-service'
import { getValidatedData } from '../../utils/validation'

interface PatchDonationViewModel {
  donation: DeepPartial<Donation>
  generateReceipt: boolean
}

const patchDonationSchema = Joi.object<PatchDonationViewModel>({
  donation: Joi.object<Donation>({
    id: Joi.forbidden(),
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

export const patchDonationHandler: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const donationId = getValidatedData(Joi.string().required(), req.params.id)
  const donationPatch = getValidatedData(
    patchDonationSchema.required(),
    req.body
  )

  const patchedDonation = await donationsService.patchDonation(
    donationId,
    donationPatch.donation,
    donationPatch.generateReceipt
  )

  res.status(200).send(patchedDonation)
}
