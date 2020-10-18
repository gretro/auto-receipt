import * as winston from 'winston'
import * as config from 'config'
import * as gcloudLog from '@google-cloud/logging-winston'
import { consoleFormat } from 'winston-console-format'
import { LoggingConfig } from '../models/LoggingConfig'

const loggingConfig = config.get<LoggingConfig>('logging')

const transports = []
if (loggingConfig.console) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.padLevels(),
        consoleFormat({
          showMeta: true,
          metaStrip: ['timestamp'],
          inspectOptions: {
            depth: Infinity,
            colors: true,
            maxArrayLength: Infinity,
            breakLength: 120,
            compact: Infinity,
          },
        })
      ),
    })
  )
}
if (loggingConfig.gcloud) {
  transports.push(new gcloudLog.LoggingWinston())
}

if (loggingConfig.file) {
  transports.push(
    new winston.transports.File({
      format: winston.format.padLevels(),
      filename: `logs/${new Date().toISOString()}.log`,
    })
  )
}

export const logger = winston.createLogger({
  level: loggingConfig.logLevel,
  transports,
})
