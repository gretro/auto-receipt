export interface AppConfig {
  apiUrl: string;
  firebase: Record<string, string>;
}

let appConfig: AppConfig;

export function setAppConfig(config: AppConfig): void {
  appConfig = config;
}

export function getAppConfig(): AppConfig {
  return appConfig;
}
