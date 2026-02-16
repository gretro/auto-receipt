import config from 'config'
import winston from 'winston'
import { consoleFormat } from 'winston-console-format'
import { LoggingConfig } from '../models/LoggingConfig'

const loggingConfig = config.get<LoggingConfig>('logging')

const WINSTON_TO_CLOUD_SEVERITY: Record<string, string> = {
  error: 'ERROR',
  warn: 'WARNING',
  info: 'INFO',
  verbose: 'DEBUG',
  debug: 'DEBUG',
  silly: 'DEBUG',
}

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
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format((info) => {
          info.severity = WINSTON_TO_CLOUD_SEVERITY[info.level] ?? 'DEFAULT'
          delete (info as Record<string, unknown>).level
          return info
        })(),
        winston.format.json()
      ),
    })
  )
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
