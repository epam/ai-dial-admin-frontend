import { UserSession } from '@/src/models/auth';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { AssetApp } from '@/src/models/dial/deployment-asset';

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
  entity: DialApplication | AssetApp,
  applicationSchemes?: DialApplicationScheme[] | null,
): DialApplicationScheme | undefined => {
  if (!applicationSchemes) return entity as DialApplicationScheme;

  return applicationSchemes?.find((scheme) => {
    const appTypeSchemaId = (entity as AssetApp)?.applicationTypeSchemaId;
    const customAppSchemaId = entity?.customAppSchemaId;
    const editorUrl = entity?.editorUrl;

    return (
      (scheme.$id && appTypeSchemaId && scheme.$id === appTypeSchemaId) ||
      (scheme.$id && customAppSchemaId && scheme.$id === customAppSchemaId) ||
      (scheme['dial:applicationTypeEditorUrl'] && editorUrl && scheme['dial:applicationTypeEditorUrl'] === editorUrl)
    );
  });
};
