export interface LoggingConfig {
  logLevel: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'
  console: boolean
  gcloud: boolean
  file: boolean
}
