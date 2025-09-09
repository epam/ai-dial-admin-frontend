import { EmbeddedApp } from '@/src/context/AppContext';

const isPluginEnabled = (pluginName: string, embeddedApps: EmbeddedApp[]): boolean => {
  return embeddedApps?.some((app) => app.name === pluginName);
};

export const isDeploymentsEnabled = (embeddedApps: EmbeddedApp[]): boolean => {
  return isPluginEnabled('mcp-plugin', embeddedApps);
};
