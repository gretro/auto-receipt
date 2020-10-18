import { Request, Response } from 'express'
import { donationsRepository } from '../../datastore/donations-repository'
import { Donation } from '../../models/Donation'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  withApiToken,
} from '../../utils/http'

interface DonationListingViewModel {
  fiscalYear: number
  count: number
  donations: Donation[]
}

export const listDonations = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
  allowMethods('GET')
)(
  async (req: Request<any>, res: Response): Promise<void> => {
    const { year, externalId } = req.query

    let fiscalYear = parseInt(year, 10)
    if (isNaN(fiscalYear)) {
      fiscalYear = new Date().getFullYear()
    }

    const donations = await donationsRepository.searchDonations({
      fiscalYear,
      externalId,
    })

    const viewModel: DonationListingViewModel = {
      fiscalYear,
      donations,
      count: donations.length,
    }
    res.status(200).send(viewModel)
  }
)
