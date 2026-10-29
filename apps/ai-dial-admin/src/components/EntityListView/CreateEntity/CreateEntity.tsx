import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { isValidSourceField } from '@/src/components/SourceField/utils';
import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
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
import { isAssetView, isAssetWithVersion } from '@/src/utils/is-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { addTrailingSlash } from '@/src/utils/url';
import { DUAL_BUCKET_VIEWS, isPlatformBucketPath } from '@/src/utils/files/root-folder';
import { RoutesForCheckingUniqueName } from './constants';

interface CreateEntityBase extends BaseEntity {
  $id?: string;
  version?: string;
  displayVersion?: string;
  folderId?: string;
  userRoles?: string[];
  user_roles?: string[];
}

interface Props<T> {
  route: ApplicationRoute;
  isModalOpen: boolean;
  names: string[];
  runners?: DialApplicationScheme[];
  versionsMap?: Record<string, string[]>;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  getEntityById?: (id: string) => Promise<ServerActionResponse>;
  context?: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
  initialValues?: Partial<T>;
  isModal?: boolean;
}

const CreateEntity = <T extends CreateEntityBase>({
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
  getEntityById,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const folderContext = context?.();
  const { isValid, dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();

  // Applications and Toolsets are the asset-with-version routes that also have a flat, unversioned
  // bucket (`platform/`) — the current folder (where "New Application"/"New Toolset" was invoked
  // from) is the only signal available at create time to tell the two apart (design.md's
  // `platform-applications`/`platform-toolsets` capabilities).
  const isPlatformDualBucketCreate = DUAL_BUCKET_VIEWS.includes(route) && isPlatformBucketPath(folderContext?.filePath);

  const [currentEntity, setEntity] = useState<T>(() => {
    if (isAssetWithVersion(route) && !isPlatformDualBucketCreate) {
      return { name: '', description: '', version: DEFAULT_NEW_ENTITY_VERSION } as T;
    }

    if (route === ApplicationRoute.PlatformModels) {
      return {
        name: '',
        description: '',
        displayVersion: DEFAULT_NEW_ENTITY_VERSION,
        userRoles: [],
        ...initialValues,
      } as T;
    }

    if (route === ApplicationRoute.PlatformTranslators) {
      return {
        name: '',
        ...initialValues,
      } as T;
    }

    if (route === ApplicationRoute.PlatformRoutes) {
      return { name: '', description: '', userRoles: [], ...initialValues } as T;
    }

    if (
      isPlatformDualBucketCreate &&
      (route === ApplicationRoute.AssetsApplications || route === ApplicationRoute.AssetsToolsets)
    ) {
      return { name: '', description: '', user_roles: [], ...initialValues } as T;
    }

    return { name: '', description: '', ...initialValues } as T;
  });
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);
  const [idExistsError, setIdExistsError] = useState<string>();

  const onChangeEntity = useCallback(
    (entity: object) => {
      const updatedEntity = entity as T;
      if (updatedEntity.$id !== currentEntity.$id) {
        setIdExistsError(void 0);
      }
      setEntity(updatedEntity);
    },
    [currentEntity.$id],
  );

  const onCreate = useCallback(
    async (updatedEntity: T) => {
      const entity = {
        ...updatedEntity,
        name: updatedEntity.name?.trim(),
        ...(isAssetWithVersion(route) && !isPlatformDualBucketCreate && { display_version: updatedEntity.version }),
      };

      const isUnique = RoutesForCheckingUniqueName.includes(route)
        ? await checkIsUniqueDeploymentName(entity.name as string)
        : true;

      setIsUniqueNameError(!isUnique);

      if (!isUnique) return;

      const entityId = entity.$id;
      if (getEntityById && entityId) {
        try {
          const result = await getEntityById(entityId);
          if (result.success && result.response) {
            setIdExistsError(t(ErrorI18nKey.NameExists));
            return;
          }
        } catch {
          // The Core write remains the authoritative collision check when resolution is unavailable.
        }
      }

      if (isAssetView(route)) {
        entity.folderId = folderContext?.filePath;
      }
      // An app runner is identified by `$id`, not `name`, so both the toast and the navigation target
      // fall back to it — otherwise they carry an empty identity.
      const entityLabel = entity.name || entityId;

      getReqRef.current(createEntity, entity).then((res) => {
        if (res.success) {
          if (isAssetView(route)) {
            folderContext?.fetchFiles(folderContext?.filePath);
          }
          showNotification(
            getSuccessNotification(
              getCreateNotificationTitle(route, t),
              getCreateNotificationDescription(route, entityLabel, t),
            ),
          );
          // Skill and Project have nothing for the shared route builder's Prompts/Files/AssetsApplications/
          // AssetsToolsets/Skills branch to build a path from otherwise — no version, so it would fall
          // back to a literal `__undefined` suffix. Scoped to this one route rather than "no version"
          // generically: AssetsModels/AssetsAppRunners already prefer an explicit path over their
          // `$id` fallback, so adding one unconditionally would change their existing behavior.
          const createdEntity = isAssetView(route)
            ? {
                folderId: entity.folderId,
                name: entity.name,
                version: entity.version,
                $id: entityId,
                path:
                  route === ApplicationRoute.Skills || route === ApplicationRoute.Projects
                    ? `${addTrailingSlash(entity.folderId)}${entity.name || ''}`
                    : undefined,
              }
            : entity;
          const newEntity = res.response
            ? { ...createdEntity, ...res.response, name: res.response?._metadata?.name || res.response.name }
            : createdEntity;
          router.push(getUrnForEntity(route, newEntity));
          onClose();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [
      route,
      createEntity,
      getEntityById,
      folderContext,
      isPlatformDualBucketCreate,
      showNotification,
      t,
      router,
      onClose,
    ],
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

    if (isAssetWithVersion(route) && !isPlatformDualBucketCreate) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'version',
        isValid: !!currentEntity.version,
      });
    }

    if (route === ApplicationRoute.Routes || route === ApplicationRoute.PlatformRoutes) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'path',
        isValid: !!(currentEntity as DialRoute).paths?.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup
      onClose={onClose}
      header={getCreateEntityTitle(route, t)}
      portalId="CreateEntity"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: (isUniqueNameError != null && isUniqueNameError) || !isValid,
        onCancel: onClose,
        onSubmit: () => onCreate(currentEntity),
      })}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <Properties
          view={route}
          runners={runners}
          versionsMap={versionsMap}
          key={isAssetWithVersion(route) ? folderContext?.filePath : undefined}
          entity={isAssetWithVersion(route) ? { ...currentEntity, folderId: folderContext?.filePath } : currentEntity}
          names={names}
          isUniqueNameError={isUniqueNameError}
          externalIdError={idExistsError}
          onChangeEntity={onChangeEntity}
          initialValues={initialValues}
          isModal={isModal}
          hideVersionField={isPlatformDualBucketCreate}
        />
      </div>
    </Popup>
  );
};

export default CreateEntity;
