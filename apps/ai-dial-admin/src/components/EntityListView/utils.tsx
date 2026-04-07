import { exportApps } from '@/src/app/[lang]/assets-applications/actions';
import { exportToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import { exportFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts } from '@/src/app/[lang]/prompts/actions';
import DuplicateAdapter from '@/src/components/Adapter/Modals/DuplicateAdapter';
import DuplicateScheme from '@/src/components/ApplicationRunners/Modals/DuplicateAppRunner';
import DuplicateAsset from '@/src/components/Assets/Deployments/DuplicateAsset';
import DuplicatePopup from '@/src/components/EntityView/Modals/Duplicate/Duplicate';
import DuplicateInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Duplicate';
import DuplicateKey from '@/src/components/Keys/Modals/DuplicateKey';
import DuplicateToolset from '@/src/components/Toolsets/Modals/DuplicateToolset';
import { MenuI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { Toolset } from '@/src/models/dial/toolset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-view';
import { RefObject } from 'react';
import { prepareEntityForDuplicate } from './Components/utils';

export const getDuplicateModal = async <T extends object>(
  currentEntity: T | undefined,
  entityRef: RefObject<T | undefined>,
  names: string[],
  keys: string[],
  route: ApplicationRoute,
  versionsMap: Record<string, string[]>,
  isModalOpen: boolean,
  handleModalClose: () => void,
  onDuplicate: (entity: BaseEntity) => Promise<ServerActionResponse>,
  context?: () => AssetsFolderContext,
) => {
  if (!currentEntity) return null;
  const preparedEntity = (await prepareEntityForDuplicate(route, currentEntity, entityRef)) as T;
  if (route === ApplicationRoute.ApplicationRunners) {
    return (
      <DuplicateScheme
        entity={preparedEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
        names={names}
      />
    );
  }

  if (route === ApplicationRoute.InterceptorTemplates) {
    return (
      <DuplicateInterceptorTemplate
        template={preparedEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
        names={names}
      />
    );
  }
  if (route === ApplicationRoute.Adapters) {
    return (
      <DuplicateAdapter
        names={names}
        adapter={preparedEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.Keys) {
    return (
      <DuplicateKey
        entity={preparedEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        names={names}
        keys={keys}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.Toolsets) {
    return (
      <DuplicateToolset
        entity={preparedEntity as Toolset}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
        names={names}
      />
    );
  }

  if (isAssetWithVersion(route)) {
    return (
      <DuplicateAsset
        context={context}
        view={route}
        entity={preparedEntity as AssetWithVersion}
        versionsMap={versionsMap}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
      />
    );
  }
  return (
    <DuplicatePopup
      view={route}
      names={names || []}
      entity={preparedEntity}
      onDuplicate={onDuplicate}
      isModalOpen={isModalOpen}
      onClose={handleModalClose}
    />
  );
};

/**
 * Get notification title for success import
 *
 * @param {?ApplicationRoute} [route] - application route
 * @returns {string} - title
 */
export const getNotificationType = (route?: ApplicationRoute): string => {
  if (route === ApplicationRoute.Prompts) {
    return MenuI18nKey.Prompts;
  }
  if (route === ApplicationRoute.Files) {
    return MenuI18nKey.Files;
  }

  if (route === ApplicationRoute.AssetsApplications) {
    return MenuI18nKey.Applications;
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    return MenuI18nKey.Toolsets;
  }

  return '';
};

/**
 * Get correct export function for assets
 *
 * @param {?ApplicationRoute} [route] - application route
 * @returns {((paths: string[], type?: ImportFileType | undefined) => Promise<unknown>) | null} - export function
 */
export const getExportFunction = (
  route?: ApplicationRoute,
): ((paths: string[], type?: ImportFileType | undefined) => Promise<unknown>) | null => {
  if (route === ApplicationRoute.Prompts) {
    return exportPrompts;
  }
  if (route === ApplicationRoute.Files) {
    return exportFiles;
  }
  if (route === ApplicationRoute.AssetsApplications) {
    return exportApps;
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    return exportToolsets;
  }
  return null;
};
