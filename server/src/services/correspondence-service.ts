import * as config from 'config'
import { CorrespondenceSubject } from '../models/Correspondence'
import { InvalidConfigurationError } from '../errors/InvalidConfigurationError'
import { Donation } from '../models/Donation'

interface Field {
  value: string
  source: 'template' | 'inline-template' | 'static'
}

export interface CorrespondenceConfig {
  subject: Field
  text?: Field
  html?: Field
}

export interface CorrespondenceContent {
  subject: string
  text?: string
  html?: string
}

function getContent(
  type: CorrespondenceSubject,
  donation: Donation
): CorrespondenceSubject {}

function getConfig(type: CorrespondenceSubject): CorrespondenceConfig {
  const configName = `correspondences.${type}`
  if (!config.has(configName)) {
    throw new InvalidConfigurationError(
      `Could not find correspondence configuration at path '${configName}'`
    )
  }

  const correspondenceConfig = config.get<CorrespondenceConfig>(configName)
  return correspondenceConfig
}
