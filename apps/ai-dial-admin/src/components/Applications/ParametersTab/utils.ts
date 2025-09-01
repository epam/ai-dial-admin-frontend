import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { UserSession } from '@/src/models/auth';
import { DialApplicationResource } from '@/src/models/dial/application-resource';

export const getFrameConfig = (
  scheme: DialApplicationScheme | DialApplicationResource,
  currentTheme: string,
  session?: UserSession,
) => {
  return {
    theme: currentTheme,
    providerId: session?.providerId,
    host:
      (scheme as DialApplicationScheme)?.['dial:applicationTypeEditorUrl'] ||
      (scheme as DialApplicationResource)?.editorUrl,
    name:
      (scheme as DialApplicationScheme)?.['dial:applicationTypeDisplayName'] ||
      (scheme as DialApplicationResource)?.name,
  };
};

export const getAppRunner = (
  entity: DialApplication,
  applicationSchemes?: DialApplicationScheme[] | null,
): DialApplicationScheme | undefined => {
  return applicationSchemes
    ? applicationSchemes?.find((scheme) => scheme.$id === entity?.customAppSchemaId) ||
        applicationSchemes?.find((scheme) => scheme['dial:applicationTypeEditorUrl'] === entity?.editorUrl)
    : (entity as DialApplicationScheme);
};
