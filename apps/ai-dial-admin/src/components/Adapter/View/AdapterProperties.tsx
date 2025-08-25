'use client';

import { FC, useCallback, useEffect } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { getErrorForDisplayName } from '@/src/utils/validation/name-error';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';

interface Props {
  entity: DialAdapter;
  names?: string[];
  isEntityImmutable?: boolean;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterProperties: FC<Props> = ({ entity, names, onChangeAdapter, isEntityImmutable }) => {
  const t = useI18n() as (t: string, props?: Record<string, number>) => string;
  const { dispatch } = useSaveValidationContext();

  const validateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForDisplayName(displayName, t);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, t],
  );

  useEffect(() => {
    if (isEntityImmutable) {
      validateDisplayName(entity.displayName);
    }
  }, [entity.displayName, isEntityImmutable, validateDisplayName]);

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      onChangeAdapter({ ...entity, displayName });
    },
    [onChangeAdapter, entity],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint: string) => {
      onChangeAdapter({ ...entity, baseEndpoint });
    },
    [onChangeAdapter, entity],
  );

  // initial validation on creation adapter (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!entity.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!entity.displayName });
    dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !!entity.baseEndpoint });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col gap-6">
      {!isEntityImmutable && <IdControl entity={entity} names={names} onChangeEntity={onChangeAdapter} />}

      <DisplayNameControl required={true} displayName={entity.displayName} onChange={onChangeDisplayName} />

      <DescriptionControl entity={entity} onChangeEntity={onChangeAdapter} />

      <EndpointControl
        id="baseEndpoint"
        required={true}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        fieldTitle={t(EntityFieldsI18nKey.baseEndpoint)}
        endpoint={entity.baseEndpoint}
        onChange={onChangeEndpoint}
      />
    </div>
  );
};

export default AdapterProperties;
