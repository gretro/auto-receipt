import { Request, Response } from 'express'
import Joi from 'joi'
import { donationsRepository } from '../../datastore/donations-repository'
import { Donation } from '../../models/Donation'
import { getValidatedParam } from '../../utils/validation'

interface DonationListingViewModel {
  fiscalYear: number
  count: number
  donations: Donation[]
}

export const listDonationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fiscalYear = getValidatedParam(
    Joi.number().integer().positive().required(),
    req.params.year
  )
  const externalId = getValidatedParam(Joi.string().optional(), req.query.query)

  const donations = await donationsRepository.searchDonations({
    fiscalYear,
    externalId,
  })

  const viewModel: DonationListingViewModel = {
    fiscalYear,
    donations,
    count: donations.length,
  }
  res.status(200).json(viewModel)
}
