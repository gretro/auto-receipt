import pkg from '../../package.json'

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
