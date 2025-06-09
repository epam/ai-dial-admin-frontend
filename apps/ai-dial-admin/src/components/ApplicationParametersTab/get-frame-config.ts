import { DialApplicationScheme } from '@/src/models/dial/application';
import { UserSession } from '@/src/models/auth';

export const getFrameConfig = (scheme: DialApplicationScheme, currentTheme: string, session?: UserSession) => {
  return {
    theme: currentTheme,
    providerId: session?.providerId,
    host: scheme?.['dial:applicationTypeEditorUrl'],
    name: scheme?.['dial:applicationTypeDisplayName'],
  };
};
