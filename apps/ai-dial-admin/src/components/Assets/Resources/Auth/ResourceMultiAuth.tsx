'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import {
  DialGhostIconButton,
  DialInput,
  DialLabel,
  DialNeutralButton,
  DialPrimaryButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { IconArrowLeft, IconEdit, IconPlus, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import { signInExternalService, signOutExternalService } from '@/src/app/[lang]/assets-applications/actions';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ExternalServiceI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationResource, DialExternalService, ToolsetAuthType } from '@/src/models/dial/resource';
import ExternalServiceAuthButtons, { EXTERNAL_SERVICE_AUTH_REDIRECT_URL } from './ExternalServiceAuthButtons';
import ResourceAuthentication from './ResourceAuthentication';
import { isLoggedInToExternalService } from './external-service-auth-utils';

interface EditState {
  originalId: string;
  currentId: string;
  service: DialExternalService;
}

interface Props {
  asset: DialApplicationResource;
  onChange: (asset: DialApplicationResource) => void;
}

const ResourceMultiAuth: FC<Props> = ({ asset, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [loadingServiceId, setLoadingServiceId] = useState<string | null>(null);

  const services = useMemo(() => asset.external_services || {}, [asset.external_services]);

  const onEdit = useCallback(
    (serviceId: string) => {
      setEditState({
        originalId: serviceId,
        currentId: serviceId,
        service: { ...services[serviceId] },
      });
    },
    [services],
  );

  const onAdd = useCallback(() => {
    setEditState({
      originalId: '',
      currentId: '',
      service: {},
    });
  }, []);

  const onBack = useCallback(() => {
    setEditState(null);
  }, []);

  const onSave = useCallback(() => {
    if (!editState) return;
    const { originalId, currentId, service } = editState;
    const updated = { ...services };
    if (originalId && originalId !== currentId) {
      delete updated[originalId];
    }
    if (currentId) {
      updated[currentId] = service;
    }
    onChange({ ...asset, external_services: updated });
    setEditState(null);
  }, [asset, editState, onChange, services]);

  const onChangeService = useCallback((partial: Partial<DialExternalService>) => {
    setEditState((prev) => (prev ? { ...prev, service: { ...prev.service, ...partial } } : prev));
  }, []);

  const onDelete = useCallback(
    (serviceId: string) => {
      const updated = { ...services };
      delete updated[serviceId];
      onChange({ ...asset, external_services: updated });
    },
    [asset, onChange, services],
  );

  if (editState) {
    return (
      <div className={classNames('flex flex-col gap-y-4 rounded border border-primary p-4', STANDARD_CONTROL_WIDTH)}>
        <div className="flex items-center gap-x-2">
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconArrowLeft {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onBack}
          />
          <span className="dial-small font-semibold">
            {editState.originalId ? t(ExternalServiceI18nKey.EditService) : t(ExternalServiceI18nKey.AddService)}
          </span>
        </div>

        <DialInput
          id="serviceId"
          labelProps={{ label: t(ExternalServiceI18nKey.ServiceId), required: true }}
          placeholder={t(ExternalServiceI18nKey.ServiceId)}
          value={editState.currentId}
          onChange={(v) => setEditState((prev) => (prev ? { ...prev, currentId: v || '' } : prev))}
          disabled={isReadOnlyAdmin}
        />

        <DialInput
          id="displayName"
          labelProps={{ label: t(EntityFieldsI18nKey.displayName) }}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={editState.service.display_name || ''}
          onChange={(v) => onChangeService({ display_name: v || undefined })}
          disabled={isReadOnlyAdmin}
        />

        <DialInput
          id="description"
          labelProps={{ label: t(EntityFieldsI18nKey.description) }}
          placeholder={t(EntityPlaceholdersI18nKey.Description)}
          value={editState.service.description || ''}
          onChange={(v) => onChangeService({ description: v || undefined })}
          disabled={isReadOnlyAdmin}
        />

        <ResourceAuthentication
          name={editState.currentId}
          authSettings={editState.service.auth_settings}
          redirectUrl={EXTERNAL_SERVICE_AUTH_REDIRECT_URL}
          onChange={(auth_settings) => onChangeService({ auth_settings })}
          disabled={isReadOnlyAdmin}
          hideWithLoginOption
        />

        {!isReadOnlyAdmin && (
          <div className="flex justify-end gap-x-2">
            <DialNeutralButton label={t(ButtonsI18nKey.Back)} onClick={onBack} />
            <DialPrimaryButton label={t(ButtonsI18nKey.Apply)} onClick={onSave} disabled={!editState.currentId} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={classNames('flex flex-col gap-y-2', STANDARD_CONTROL_WIDTH)}>
      <DialLabel label={t(ExternalServiceI18nKey.ExternalServices)} />

      <div className="flex flex-col gap-y-2 rounded border border-primary p-4">
        {Object.keys(services).length === 0 && (
          <p className="dial-small text-secondary">{t(ExternalServiceI18nKey.NoServices)}</p>
        )}

        <div className="flex flex-col gap-y-2">
          {Object.entries(services).map(([serviceId, service]) => (
            <div
              key={serviceId}
              className="flex items-center gap-x-2 rounded bg-layer-3 border border-tertiary px-4 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="dial-small font-semibold truncate">{service.display_name || serviceId}</div>
                {service.display_name && <div className="dial-small text-secondary truncate">{serviceId}</div>}
              </div>

              <div className="flex items-center gap-x-1 shrink-0">
                {service.auth_settings?.authentication_type &&
                  service.auth_settings.authentication_type !== ToolsetAuthType.NONE && (
                    <div
                      className={classNames(
                        'w-[8px] h-[8px] rounded-full',
                        isLoggedInToExternalService(service) ? 'bg-accent-secondary' : 'bg-red-400',
                      )}
                    />
                  )}
              </div>

              <div className="flex items-center gap-x-1 shrink-0">
                <ExternalServiceAuthButtons
                  appPath={asset.path}
                  serviceId={serviceId}
                  service={service}
                  signIn={signInExternalService}
                  signOut={signOutExternalService}
                  onLoadingChange={(loading) => setLoadingServiceId(loading ? serviceId : null)}
                />
                {!isReadOnlyAdmin && loadingServiceId !== serviceId && (
                  <>
                    <DialGhostIconButton
                      size={ElementSize.Small}
                      icon={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
                      onClick={() => onEdit(serviceId)}
                    />
                    <DialGhostIconButton
                      size={ElementSize.Small}
                      icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} className="text-error" />}
                      onClick={() => onDelete(serviceId)}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isReadOnlyAdmin && (
          <DialNeutralButton
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            label={t(ExternalServiceI18nKey.AddService)}
            onClick={onAdd}
          />
        )}
      </div>
    </div>
  );
};

export default ResourceMultiAuth;
