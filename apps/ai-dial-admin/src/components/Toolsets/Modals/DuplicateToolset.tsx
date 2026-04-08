import { DialFormPopup, DialInput, DialPasswordInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  isModalOpen: boolean;
  names: string[];
  entity: Toolset;
  onClose: () => void;
  onDuplicate: (entity: Toolset) => void;
}

const DuplicateToolset: FC<Props> = ({ names, onDuplicate, isModalOpen, onClose, entity }) => {
  const t = useI18n();

  const [clonedEntity, setEntity] = useState<Toolset>({
    ...entity,
    name: getClonedEntityName(entity.name, true),
    displayName: getClonedEntityName(entity.displayName, true),
  });
  const { isValid, dispatch } = useSaveValidationContext();

  const authType = useMemo(
    () => clonedEntity.authSettings?.authenticationType || ToolsetAuthType.NONE,
    [clonedEntity.authSettings?.authenticationType],
  );

  // Initial validation
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!clonedEntity.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!clonedEntity.displayName });

    // Auth-specific validation
    if (authType === ToolsetAuthType.OAUTH) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'clientId',
        isValid: !!clonedEntity.authSettings?.clientId,
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'clientSecret',
        isValid: !!clonedEntity.authSettings?.clientSecret,
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authorizationEndpoint',
        isValid: !!clonedEntity.authSettings?.authorizationEndpoint,
      });
    } else if (authType === ToolsetAuthType.API_KEY) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'apiKeyHeader',
        isValid: !!clonedEntity.authSettings?.apiKeyHeader,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setEntity({ ...clonedEntity, displayName });
    },
    [clonedEntity],
  );

  const onChangeClientId = useCallback(
    (clientId?: string) => {
      const updatedEntity = {
        ...clonedEntity,
        authSettings: { ...clonedEntity.authSettings!, clientId },
      };
      setEntity(updatedEntity);
      dispatch({ type: ValidationActionType.SetField, field: 'clientId', isValid: !!clientId });
    },
    [clonedEntity, dispatch],
  );

  const onChangeClientSecret = useCallback(
    (clientSecret?: string) => {
      const updatedEntity = {
        ...clonedEntity,
        authSettings: { ...clonedEntity.authSettings!, clientSecret },
      };
      setEntity(updatedEntity);
      dispatch({ type: ValidationActionType.SetField, field: 'clientSecret', isValid: !!clientSecret });
    },
    [clonedEntity, dispatch],
  );

  const onChangeAuthorizationEndpoint = useCallback(
    (authorizationEndpoint?: string) => {
      const updatedEntity = {
        ...clonedEntity,
        authSettings: { ...clonedEntity.authSettings!, authorizationEndpoint },
      };
      setEntity(updatedEntity);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authorizationEndpoint',
        isValid: !!authorizationEndpoint,
      });
    },
    [clonedEntity, dispatch],
  );

  const onChangeApiKeyHeader = useCallback(
    (apiKeyHeader?: string) => {
      const updatedEntity = {
        ...clonedEntity,
        authSettings: { ...clonedEntity.authSettings!, apiKeyHeader },
      };
      setEntity(updatedEntity);
      dispatch({ type: ValidationActionType.SetField, field: 'apiKeyHeader', isValid: !!apiKeyHeader });
    },
    [clonedEntity, dispatch],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.Toolsets, t))}
      portalId="DuplicateToolset"
      open={isModalOpen}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
      onSubmit={() => onDuplicate(clonedEntity)}
      onCancel={onClose}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col px-6 py-4">
        <div className="flex flex-col gap-y-8">
          <IdControl entity={clonedEntity} onChangeEntity={setEntity} names={names} />

          <DisplayNameControl displayName={clonedEntity.displayName} onChange={onChangeDisplayName} required />

          {authType !== ToolsetAuthType.NONE && (
            <h3>
              {authType === ToolsetAuthType.OAUTH && t(ToolsetI18nKey.OAuth)}
              {authType === ToolsetAuthType.API_KEY && t(ToolsetI18nKey.ApiKey)}
            </h3>
          )}

          {authType === ToolsetAuthType.OAUTH && (
            <>
              <DialInput
                id="clientId"
                labelProps={{ label: t(EntityFieldsI18nKey.clientId), required: true }}
                value={clonedEntity.authSettings?.clientId || ''}
                placeholder={t(EntityPlaceholdersI18nKey.ClientId)}
                onChange={onChangeClientId}
              />
              <DialPasswordInput
                id="clientSecret"
                labelProps={{ label: t(EntityFieldsI18nKey.clientSecret), required: true }}
                value={clonedEntity.authSettings?.clientSecret || ''}
                placeholder={t(EntityPlaceholdersI18nKey.ClientSecret)}
                onChange={onChangeClientSecret}
              />
              <EndpointControl
                id="authorizationEndpoint"
                required
                isFullWidth
                label={t(EntityFieldsI18nKey.authorizationEndpoint)}
                endpoint={clonedEntity.authSettings?.authorizationEndpoint || ''}
                placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
                onChange={onChangeAuthorizationEndpoint}
              />
            </>
          )}

          {authType === ToolsetAuthType.API_KEY && (
            <DialInput
              id="apiKeyHeader"
              labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader), required: true }}
              placeholder={t(EntityPlaceholdersI18nKey.Header)}
              value={clonedEntity.authSettings?.apiKeyHeader || ''}
              onChange={onChangeApiKeyHeader}
            />
          )}
        </div>
      </div>
    </DialFormPopup>
  );
};

export default DuplicateToolset;
