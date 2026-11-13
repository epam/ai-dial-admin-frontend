'use client';

import { Popup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialRoute } from '@/src/models/dial/route';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getInitialPlatformEntity } from './utils';

interface PlatformEntityDraft extends BaseEntity {
  $id?: string;
  displayName?: string;
}

interface Props {
  view: ApplicationRoute;
  isOpen: boolean;
  names: string[];
  initialValues?: Partial<PlatformEntityDraft>;
  /** Rendered above the form, for an entry point that lets the user choose the destination. */
  topSlot?: ReactNode;
  createEntity: (entity: AssetWithVersion) => Promise<ServerActionResponse>;
  getEntityById?: (id: string) => Promise<ServerActionResponse>;
  onClose: () => void;
}

/**
 * The create form for a flat platform entity (models, routes, runners, schemas, interceptors, translators,
 * routers, roles, toolsets). A platform resource has no versions, no folders and no folder context, so none of
 * those inputs exist here; the entity is written to the flat `platform/` bucket.
 */
const CreatePlatformEntityForm: FC<Props> = ({
  view,
  isOpen,
  names,
  initialValues,
  topSlot,
  createEntity,
  getEntityById,
  onClose,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { isValid, dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();
  const [entity, setEntity] = useState<PlatformEntityDraft>(() => getInitialPlatformEntity(view, initialValues));
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);
  const [idExistsError, setIdExistsError] = useState<string>();

  const onChangeEntity = useCallback(
    (updated: object) => {
      const next = updated as PlatformEntityDraft;
      if (next.$id !== entity.$id) {
        setIdExistsError(void 0);
      }
      setEntity(next);
    },
    [entity.$id],
  );

  const onCreate = useCallback(async () => {
    const payload = { ...entity, name: entity.name?.trim(), folderId: `${PLATFORM_ROOT_FOLDER}/` };

    // An app runner or catalog schema is identified by `$id`, so a taken `$id` is refused before the write.
    if (getEntityById && payload.$id) {
      try {
        const result = await getEntityById(payload.$id);
        if (result.success && result.response) {
          setIdExistsError(t(ErrorI18nKey.NameExists));
          return;
        }
      } catch {
        // The Core write remains the authoritative collision check when resolution is unavailable.
      }
    }

    // The toast and the navigation fall back to `$id` for an entity that has no `name` of its own.
    const label = payload.name || payload.$id;
    const res = await getReqRef.current(createEntity, payload as unknown as AssetWithVersion);
    if (!res.success) {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      return;
    }

    showNotification(
      getSuccessNotification(
        getCreateNotificationTitle(view, t),
        getCreateNotificationDescription(view, label ?? '', t),
      ),
    );
    const created = { folderId: payload.folderId, name: payload.name, $id: payload.$id };
    const createdEntity = res.response
      ? { ...created, ...res.response, name: res.response?._metadata?.name || res.response.name || payload.name }
      : created;
    router.push(getUrnForEntity(view, createdEntity));
    onClose();
  }, [entity, getEntityById, createEntity, view, showNotification, t, router, onClose]);

  useEffect(() => {
    setIsUniqueNameError(void 0);
  }, [entity, view, names]);

  // Initial validation: nothing can be saved before the required fields hold a value.
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!entity.name });
    if (view === ApplicationRoute.AssetsToolsets) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!entity.displayName });
    }
    if (view === ApplicationRoute.PlatformRoutes) {
      dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !!(entity as DialRoute).paths?.length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popup
      onClose={onClose}
      header={getCreateEntityTitle(view, t)}
      portalId="CreatePlatformEntity"
      open={isOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: !!isUniqueNameError || !isValid,
        onCancel: onClose,
        onSubmit: onCreate,
      })}
    >
      <div className="flex flex-col gap-y-4 overflow-auto px-6 py-4">
        {topSlot}
        <Properties
          view={view}
          entity={entity}
          names={names}
          isUniqueNameError={isUniqueNameError}
          externalIdError={idExistsError}
          onChangeEntity={onChangeEntity}
          initialValues={initialValues}
          isModal
          hideVersionField
        />
      </div>
    </Popup>
  );
};

export default CreatePlatformEntityForm;
