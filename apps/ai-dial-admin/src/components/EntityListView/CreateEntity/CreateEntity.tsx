import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { isValidSourceField } from '@/src/components/SourceField/utils';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { DialRoute } from '@/src/models/dial/route';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { isAssetView } from '@/src/utils/is-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { RoutesForCheckingUniqueName } from './constants';

interface CreatePromptEntity extends BaseEntity {
  version?: string;
  folderId?: string;
}

interface Props<T> {
  route: ApplicationRoute;
  isModalOpen: boolean;
  names: string[];
  runners?: DialApplicationScheme[];
  versionsMap?: Record<string, string[]>;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  context?: () => AssetsFolderContext;
  onClose: () => void;
  initialValues?: Partial<T>;
  isModal?: boolean;
}

const CreateEntity = <T extends CreatePromptEntity>({
  runners,
  route,
  isModalOpen,
  names,
  versionsMap,
  onClose,
  createEntity,
  initialValues,
  context,
  isModal,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const folderContext = context?.();
  const { isValid, dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();

  const [currentEntity, setEntity] = useState<T>(
    versionsMap
      ? ({ name: '', description: '', version: DEFAULT_NEW_ENTITY_VERSION } as T)
      : ({ name: '', description: '', ...initialValues } as T),
  );
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);

  const onCreate = useCallback(
    async (updatedEntity: T) => {
      const entity = {
        ...updatedEntity,
        name: updatedEntity.name?.trim(),
      };

      const isUnique = RoutesForCheckingUniqueName.includes(route)
        ? await checkIsUniqueDeploymentName(entity.name as string)
        : true;

      setIsUniqueNameError(!isUnique);

      if (!isUnique) return;

      if (isAssetView(route)) {
        entity.folderId = folderContext?.filePath;
      }
      getReqRef.current(createEntity, entity).then((res) => {
        if (res.success) {
          if (isAssetView(route)) {
            folderContext?.fetchFiles(folderContext?.filePath);
          }
          showNotification(
            getSuccessNotification(
              getCreateNotificationTitle(route, t),
              getCreateNotificationDescription(route, entity.name, t),
            ),
          );
          const originalRoute = route.split('/')[1];
          const newEntity = isAssetView(route)
            ? { folderId: entity.folderId, name: entity.name, version: entity.version }
            : res.response || entity;
          router.push(`${initialValues ? '/' : ''}${originalRoute}/${getEntityPath(route, newEntity, false)}`);
          onClose();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [route, createEntity, folderContext, showNotification, t, router, initialValues, onClose],
  );

  useEffect(() => {
    setIsUniqueNameError(void 0);
  }, [currentEntity, route, versionsMap, names]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentEntity.name });
    if (!versionsMap || route === ApplicationRoute.AssetsApplications || route === ApplicationRoute.AssetsToolsets) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!currentEntity.displayName });
    }

    if ((route === ApplicationRoute.Models || route === ApplicationRoute.Toolsets) && !initialValues) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'source',
        isValid: isValidSourceField(currentEntity as DialModel),
      });
    }

    if (versionsMap) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'version',
        isValid: !!currentEntity.version,
      });
    }

    if (route === ApplicationRoute.Routes) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'path',
        isValid: !!(currentEntity as DialRoute).paths?.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCreateEntityTitle(route, t)}
      portalId="CreateEntity"
      open={isModalOpen}
      onSubmit={() => onCreate(currentEntity)}
      onCancel={onClose}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={(isUniqueNameError != null && isUniqueNameError) || !isValid}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <Properties
          view={route}
          runners={runners}
          versionsMap={versionsMap}
          entity={currentEntity}
          names={names}
          isUniqueNameError={isUniqueNameError}
          onChangeEntity={(entity) => setEntity(entity as T)}
          initialValues={initialValues}
          isModal={isModal}
        />
      </div>
    </DialFormPopup>
  );
};

export default CreateEntity;
