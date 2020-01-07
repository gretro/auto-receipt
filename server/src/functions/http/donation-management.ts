import { Request, Response } from 'express'
import {
  pipeMiddlewares,
  handleErrors,
  withApiToken,
  allowMethods,
} from '../../utils/http'
import { donationsRepository } from '../../datastore/donations-repository'
import { Donation } from '../../models/Donation'

interface DonationListingViewModel {
  fiscalYear: number
  donations: Donation[]
}

export const listDonations = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
  allowMethods('GET')
)(
  async (req: Request<{}>, res: Response): Promise<void> => {
    const { year } = req.query

    let fiscalYear = parseInt(year, 10)
    if (isNaN(fiscalYear)) {
      fiscalYear = new Date().getFullYear()
    }

    const donations = await donationsRepository.listDonations(fiscalYear)

    const viewModel: DonationListingViewModel = {
      fiscalYear,
      donations,
    }
    res.status(200).send(viewModel)
  }
)
