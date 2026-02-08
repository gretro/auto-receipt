import path from 'path'

// Dynamic require so package.json is not pulled into the TS build output (avoids lib/src and copying package.json)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require(path.resolve(__dirname, '..', '..', 'package.json')) as {
  name: string
  version: string
}

export interface AppInfo {
  appName: string
  version: string
}

export function getAppInfo(): AppInfo {
  const appInfo: AppInfo = {
    appName: pkg.name,
    version: pkg.version,
  }

  return appInfo
}
