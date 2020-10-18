import * as path from 'path'

const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(packageJsonPath)

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
