import { Request, Response } from 'express'
import { donationsRepository } from '../../datastore/donations-repository'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { Donation } from '../../models/Donation'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  withAuth,
} from '../../utils/http'

interface DonationListingViewModel {
  fiscalYear: number
  count: number
  donations: Donation[]
}

export const getDonation = pipeMiddlewares(
  handleErrors(),
  withAuth(),
  allowMethods('GET')
)(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.query

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
  handleErrors(),
  withAuth(),
  allowMethods('GET')
)(
  async (req: Request, res: Response): Promise<void> => {
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
