import { Request, Response } from 'express'
import { donationsRepository } from '../../datastore/donations-repository'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { Donation } from '../../models/Donation'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  withAuth,
  withCORS,
} from '../../utils/http'

interface DonationListingViewModel {
  fiscalYear: number
  count: number
  donations: Donation[]
}

export const getDonation = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('GET')
)(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.query.id as string

    if (!id) {
      res.sendStatus(400)
      return
    }

    const donation = await donationsRepository.getDonationById(id)
    if (!donation) {
      throw new EntityNotFoundError('Donation', id)
    }

    res.status(200).send(donation)
  }
)

export const listDonations = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('GET')
)(
  async (req: Request, res: Response): Promise<void> => {
    const year: string = req.query.year as string
    const externalId = req.query.query as string

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
