'use client';

import { FC, useCallback, useEffect } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { getErrorForDisplayName } from '@/src/utils/validation/name-error';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import TopicsControl from '@/src/components/BaseControls/Topics';

interface Props {
  entity: DialAdapter;
  names?: string[];
  isEntityImmutable?: boolean;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterProperties: FC<Props> = ({ entity, names, onChangeAdapter, isEntityImmutable }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const onValidateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForDisplayName(displayName, true, t);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, t],
  );

  useEffect(() => {
    if (isEntityImmutable) {
      onValidateDisplayName(entity.displayName);
    }
  }, [entity.displayName, isEntityImmutable, onValidateDisplayName]);

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      onChangeAdapter({ ...entity, displayName });
    },
    [onChangeAdapter, entity],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint?: string) => {
      onChangeAdapter({ ...entity, baseEndpoint });
    },
    [onChangeAdapter, entity],
  );

  return (
    <div className="h-full flex flex-col gap-y-8">
      {!isEntityImmutable && <IdControl entity={entity} names={names} onChangeEntity={onChangeAdapter} />}

      <DisplayNameControl
        displayName={entity.displayName}
        required={true}
        onChange={onChangeDisplayName}
        isFullWidth={!isEntityImmutable}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeAdapter} isFullWidth={!isEntityImmutable} />

      <EndpointControl
        id="baseEndpoint"
        required={true}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        fieldTitle={t(EntityFieldsI18nKey.baseEndpoint)}
        endpoint={entity.baseEndpoint}
        isFullWidth={!isEntityImmutable}
        onChange={onChangeEndpoint}
      />

      {isEntityImmutable && <TopicsControl entity={entity} onChange={onChangeAdapter} />}
    </div>
  );
};

export default AdapterProperties;
