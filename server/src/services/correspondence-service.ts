import mjml2html = require('mjml')
import config from 'config'
import { v4 as uuidV4 } from 'uuid'
import { donationsRepository } from '../datastore/donations-repository'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { HandlebarsError } from '../errors/HandlebarsError'
import { InvalidEntityStateError } from '../errors/InvalidEntityStateError'
import { MjmlError } from '../errors/MjmlError'
import { MjmlParseError } from '../errors/MjmlParseError'
import { CorrespondenceConfig } from '../models/config-models/Correspondence-config'
import { Correspondence, CorrespondenceType } from '../models/Correspondence'
import { DocumentMetadata } from '../models/DocumentMetadata'
import { Donation, DonationType } from '../models/Donation'
import { PaymentSource } from '../models/Payment'
import { getEmailProvider } from '../providers/email'
import { EmailAttachment } from '../providers/email/EmailProvider'
import { getFileProvider } from '../providers/file'
import {
  getCurrencyHelper,
  getDateHelper,
  handlebarsFactory,
} from '../utils/handlebars'

interface EmailContent {
  subject: string
  html: string
}

interface DonationInfo {
  donorFirstName: string | null
  donorLastName: string | null
  donationDate: Date
  donationAmount: number
  donationCurrency: string
  donationType: DonationType
  donationSource: PaymentSource
  fiscalYear: number
}

async function sendEmail(
  donationId: string,
  type: CorrespondenceType
): Promise<Correspondence> {
  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', donationId)
  }

  if (!donation.emailReceipt) {
    throw new InvalidEntityStateError('donation', donationId, 'sendEmail', [
      'Donation is set to prevent any email submission',
    ])
  }

  if (donation.donor.email == null) {
    throw new InvalidEntityStateError('donation', donationId, 'sendEmail', [
      'Donation has no email address registered',
    ])
  }

  const attachments = getAttachmentsToInclude(donation, type)
  const correspondence = await createCorrespondence(
    donation,
    type,
    attachments.map((doc) => doc.id)
  )

  const [emailContent, emailAttachments] = await Promise.all([
    getEmailContent(donation, type),
    getEmailAttachments(attachments),
  ])

  let correspondenceStatus: 'sent' | 'error' = 'sent'
  try {
    const emailProvider = getEmailProvider()
    await emailProvider.sendEmail({
      to: correspondence.sentTo,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments: emailAttachments,
    })
  } catch (err) {
    correspondenceStatus = 'error'

    throw err
  } finally {
    return await setCorrespondenceStatus(
      donation,
      correspondence,
      correspondenceStatus
    )
  }
}

function getAttachmentsToInclude(
  donation: Donation,
  type: CorrespondenceType
): DocumentMetadata[] {
  if (type === 'thank-you') {
    const docs = [...donation.documents].sort(
      (left, right) => right.created.getTime() - left.created.getTime()
    )

    if (docs.length === 0) {
      throw new InvalidEntityStateError('donation', donation.id, 'sendEmail', [
        'No documents metadata found on donation',
      ])
    }

    return [docs[0]]
  }

  return []
}

async function createCorrespondence(
  donation: Donation,
  type: CorrespondenceType,
  attachments: string[]
): Promise<Correspondence> {
  const correspondence: Correspondence = {
    id: uuidV4(),
    date: new Date(),
    sentTo: donation.donor.email!,
    type,
    attachments,
    status: 'created',
  }

  donation.correspondences.push(correspondence)
  await donationsRepository.updateDonation(donation, false)

  return correspondence
}

async function getEmailContent(
  donation: Donation,
  type: CorrespondenceType
): Promise<EmailContent> {
  const fileProvider = await getFileProvider()

  const templateName = `${type}.mjml`
  const template = await fileProvider.loadTemplate(templateName)
  if (!template) {
    throw new EntityNotFoundError('Email template', templateName)
  }

  const mjml = buildMjml(template, donation)
  const html = buildHtml(mjml)

  const correspondenceConfig =
    config.get<CorrespondenceConfig>('correspondence')
  const subject = correspondenceConfig[type].subject || 'Merci / Thank you'

  return {
    html,
    subject,
  }
}

function buildMjml(template: string, donation: Donation): string {
  const handlebars = handlebarsFactory(getDateHelper(), getCurrencyHelper())
  try {
    const mjmlGenerator = handlebars.compile(template, { strict: true })
    const donationInfo = buildDonationInfo(donation)
    const mjml = mjmlGenerator(donationInfo)

    return mjml
  } catch (err) {
    throw new HandlebarsError(err)
  }
}

function buildDonationInfo(donation: Donation): DonationInfo {
  const paymentInfo = donation.payments.reduce(
    (acc, payment, index) => {
      acc.total += payment.amount
      if (index === 0) {
        acc.currency = payment.currency
        acc.source = payment.source
      }

      return acc
    },
    { total: 0, currency: '', source: 'paypal' as PaymentSource }
  )

  return {
    donorFirstName: donation.donor.firstName,
    donorLastName: donation.donor.lastName,
    donationAmount: paymentInfo.total,
    donationCurrency: paymentInfo.currency,
    donationSource: paymentInfo.source,
    donationDate: donation.created,
    donationType: donation.type,
    fiscalYear: donation.fiscalYear,
  }
}

function buildHtml(mjml: string): string {
  try {
    const parseResult = mjml2html(mjml, { minify: true })
    if (parseResult.errors && parseResult.errors.length > 0) {
      throw new MjmlParseError(parseResult.errors)
    }

    return parseResult.html
  } catch (err) {
    if (err instanceof MjmlParseError) {
      throw err
    }

    throw new MjmlError(err)
  }
}

async function getEmailAttachments(
  documents: DocumentMetadata[]
): Promise<EmailAttachment[]> {
  const fileProvider = await getFileProvider()

  const promises = documents.map(async (doc) => {
    const data = await fileProvider.loadDocument(doc.name)
    if (!data) {
      throw new EntityNotFoundError('Document content', doc.id)
    }

    const attachment: EmailAttachment = {
      name: doc.name,
      data,
      contentType: 'application/pdf',
    }
    return attachment
  })

  return await Promise.all(promises)
}

async function setCorrespondenceStatus(
  donation: Donation,
  correspondence: Correspondence,
  status: 'sent' | 'error'
): Promise<Correspondence> {
  if (!donation.correspondences.find((corr) => corr.id === correspondence.id)) {
    donation.correspondences.push(correspondence)
  }

  correspondence.status = status
  await donationsRepository.updateDonation(donation, false)

  return correspondence
}

export const correspondenceService = {
  sendEmail,
}
