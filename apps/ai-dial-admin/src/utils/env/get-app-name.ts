const DEFAULT_APP_NAME = 'AI DIAL Admin';

export const getAppName = (): string => process.env.APP_NAME || DEFAULT_APP_NAME;
