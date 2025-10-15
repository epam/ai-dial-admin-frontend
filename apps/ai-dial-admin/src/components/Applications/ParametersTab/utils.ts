import { EntitiesI18nKey } from '@/src/constants/i18n';
import { UserSession } from '@/src/models/auth';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';
import { ParamsView } from './types';

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

export const getInitialParamsView = (route?: ApplicationRoute, uiExist?: boolean): ParamsView => {
  if (route === ApplicationRoute.ApplicationPublications || route === ApplicationRoute.ApplicationRunners) {
    return ParamsView.FORM;
  }
  if (uiExist) {
    return ParamsView.UI;
  }
  return ParamsView.TABLE;
};

export const generateViewItems = (
  t: (s: string) => string,
  route?: ApplicationRoute,
  showUi?: boolean,
  showForm?: boolean,
): DropdownItemsModel[] => {
  if (route === ApplicationRoute.ApplicationPublications || route === ApplicationRoute.ApplicationRunners) {
    return [];
  }
  const items: DropdownItemsModel[] = [
    {
      id: ParamsView.TABLE,
      name: t(EntitiesI18nKey[ParamsView.TABLE]),
    },
  ];

  if (showForm) {
    items.push({
      id: ParamsView.FORM,
      name: t(EntitiesI18nKey[ParamsView.FORM]),
    });
  }

  if (showUi) {
    items.push({
      id: ParamsView.UI,
      name: t(EntitiesI18nKey[ParamsView.UI]),
    });
  }

  return items;
};
