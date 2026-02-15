import { RequestHandler } from 'express'
import Joi from 'joi'
import { donationsRepository } from '../../datastore/donations-repository'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { getValidatedParam } from '../../utils/validation'

export const getDonationByIdHandler: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const id = getValidatedParam(Joi.string().required(), req.params.id)

  const donation = await donationsRepository.getDonationById(id)
  if (!donation) {
    throw new EntityNotFoundError('Donation', id)
  }

  res.status(200).send(donation)
}
