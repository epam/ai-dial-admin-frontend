import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialFormPopup } from '@epam/ai-dial-ui-kit';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import ApiKeyHeaderControl from '@/src/components/Toolsets/Auth/Controls/ApiKeyHeaderControl';
import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
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
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean | undefined>(void 0);

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
      clonedEntity.authSettings = {
        authenticationType: ToolsetAuthType.NONE,
      };
    } else if (authType === ToolsetAuthType.API_KEY) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authSettings.apiKeyHeader',
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

  const onChangeApiKeyHeader = useCallback(
    (apiKeyHeader: string) => {
      const updatedEntity = {
        ...clonedEntity,
        authSettings: { ...clonedEntity.authSettings!, apiKeyHeader },
      };
      setEntity(updatedEntity);
    },
    [clonedEntity],
  );

  const onIdChange = useCallback(async (entity: Toolset) => {
    setEntity(entity);
    setIsUniqueNameError(false);
  }, []);

  const onDuplicateClick = useCallback(async () => {
    const isUnique = await checkIsUniqueDeploymentName(clonedEntity.name as string);

    setIsUniqueNameError(!isUnique);

    if (!isUnique) return;

    onDuplicate(clonedEntity);
  }, [clonedEntity, onDuplicate]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.Toolsets, t))}
      portalId="DuplicateToolset"
      open={isModalOpen}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
      onSubmit={onDuplicateClick}
      onCancel={onClose}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col px-6 py-4">
        <div className="flex flex-col gap-y-8">
          <IdControl entity={clonedEntity} onChangeEntity={onIdChange} isUniqueNameError={isUniqueNameError} />

          <DisplayNameControl
            displayName={clonedEntity.displayName}
            onChange={onChangeDisplayName}
            names={names}
            required
          />

          {authType === ToolsetAuthType.API_KEY && <h3>{t(ToolsetI18nKey.ApiKey)}</h3>}

          {authType === ToolsetAuthType.API_KEY && (
            <ApiKeyHeaderControl
              apiKeyHeader={clonedEntity.authSettings?.apiKeyHeader}
              onChange={onChangeApiKeyHeader}
            />
          )}
        </div>
      </div>
    </DialFormPopup>
  );
};

export default DuplicateToolset;
