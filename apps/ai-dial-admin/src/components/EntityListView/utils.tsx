import { exportFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts } from '@/src/app/[lang]/prompts/actions';
import DuplicateAdapter from '@/src/components/Adapter/Modals/DuplicateAdapter';
import DuplicateScheme from '@/src/components/ApplicationRunners/Modals/DuplicateAppRunner';
import DuplicatePrompt from '@/src/components/Assets/Prompts/Modals/DuplicatePrompt';
import DuplicatePopup from '@/src/components/EntityView/Modals/Duplicate/Duplicate';
import DuplicateInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Duplicate';
import DuplicateKey from '@/src/components/Keys/Modals/DuplicateKey';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';

export const getDuplicateModal = <T extends object>(
  currentEntity: T | undefined,
  names: string[],
  keys: string[],
  route: ApplicationRoute,
  versionsMap: Record<string, string[]>,
  isModalOpen: boolean,
  handleModalClose: () => void,
  onDuplicate: (entity: BaseEntity) => Promise<ServerActionResponse>,
) => {
  if (!currentEntity) return null;

  if (route === ApplicationRoute.ApplicationRunners) {
    return (
      <DuplicateScheme
        entity={currentEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.InterceptorTemplates) {
    return (
      <DuplicateInterceptorTemplate
        template={currentEntity}
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
        adapter={currentEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.Keys) {
    return (
      <DuplicateKey
        entity={currentEntity}
        onDuplicate={onDuplicate}
        isModalOpen={isModalOpen}
        names={names}
        keys={keys}
        onClose={handleModalClose}
      />
    );
  }

  if (route === ApplicationRoute.Prompts) {
    return (
      <DuplicatePrompt
        entity={currentEntity as DialPrompt}
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
      entity={currentEntity}
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
  return null;
};

/**
 * Generate name for exported json file based on route
 *
 * @param {?ApplicationRoute} [route] - application route
 * @returns {string} - file name
 */
export const getJsonFileName = (route?: ApplicationRoute): string => {
  if (route === ApplicationRoute.Prompts) {
    return 'prompts';
  }
  if (route === ApplicationRoute.Files) {
    return 'files';
  }

  if (route === ApplicationRoute.AssetsApplications) {
    return 'applications';
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    return 'toolsets';
  }

  return '';
};
