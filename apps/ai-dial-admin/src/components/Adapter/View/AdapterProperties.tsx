'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { FieldError } from '@/src/models/error';
import { getErrorForDisplayName } from '@/src/utils/validation/name-error';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props {
  entity: DialAdapter;
  names?: string[];
  isEntityImmutable?: boolean;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterProperties: FC<Props> = ({ entity, names, onChangeAdapter, isEntityImmutable }) => {
  const t = useI18n() as (t: string, props?: Record<string, number>) => string;
  const { dispatch } = useSaveValidationContext();

  const [baseEndpointError, setBaseEndpointError] = useState<FieldError | null>(null);

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

  const validateEndpoint = useCallback(
    (endpoint?: string) => {
      const error = getUrlError(endpoint, true, t);
      setBaseEndpointError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !error });
    },
    [dispatch, t],
  );
  useEffect(() => {
    if (isEntityImmutable) {
      validateEndpoint(entity.baseEndpoint);
    }
  }, [entity.baseEndpoint, isEntityImmutable, validateEndpoint]);

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      onChangeAdapter({ ...entity, displayName });
    },
    [onChangeAdapter, entity],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint: string) => {
      if (!isEntityImmutable) {
        validateEndpoint(baseEndpoint);
      }
      onChangeAdapter({ ...entity, baseEndpoint });
    },
    [isEntityImmutable, onChangeAdapter, entity, validateEndpoint],
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

      <DisplayNameControl
        displayName={entity.displayName}
        isEntityImmutable={isEntityImmutable}
        onChange={onChangeDisplayName}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeAdapter} />

      <TextInputField
        elementId="endpoint"
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        fieldTitle={t(EntityFieldsI18nKey.baseEndpoint)}
        value={entity.baseEndpoint}
        onChange={onChangeEndpoint}
        errorText={baseEndpointError?.text}
        invalid={!!baseEndpointError}
      />
    </div>
  );
};

export default AdapterProperties;
