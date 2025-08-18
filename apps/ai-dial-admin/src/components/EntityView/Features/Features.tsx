import { FC, useCallback, useEffect, useState } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Switch from '@/src/components/Common/Switch/Switch';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity, DialFeatures } from '@/src/models/dial/base-entity';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrlError } from '@/src/utils/validation/url-error';
import { getSwitchControls, getTextControls } from './utils';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  view: ApplicationRoute;
  entity: DialBaseEntity;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityFeatures: FC<Props> = ({ view, entity, onChangeEntity }) => {
  const t = useI18n() as (key: string) => string;
  const switchKeys = getSwitchControls(view);
  const textKeys = getTextControls(view);

  const [textFieldErrors, setTextFieldErrors] = useState<Record<string, FieldError | null>>({});

  const { dispatch } = useSaveValidationContext();

  useEffect(() => {
    const initialErrors: Record<string, FieldError | null> = {};
    textKeys.forEach((key) => {
      const value = entity.features?.[key] as string;
      if (value) {
        initialErrors[key] = getUrlError(value, false, t);
      } else {
        initialErrors[key] = null;
      }
    });
    setTextFieldErrors(initialErrors);

    textKeys.forEach((key) => {
      const value = entity.features?.[key] as string;
      const error = value ? getUrlError(value, false, t) : null;
      dispatch({ type: ValidationActionType.SetField, field: key, isValid: !error });
    });
  }, [textKeys, entity.features, t, dispatch]);

  useEffect(() => {
    textKeys.forEach((key) => {
      const error = textFieldErrors[key];
      dispatch({ type: ValidationActionType.SetField, field: key, isValid: !error });
    });
  }, [textFieldErrors, textKeys, dispatch]);

  const onSwitch = useCallback(
    (value: boolean, key: keyof DialFeatures) => {
      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          [key]: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity],
  );

  const onChange = useCallback(
    (value: string, key: keyof DialFeatures) => {
      const urlError = getUrlError(value, false, t);
      setTextFieldErrors((prev) => ({
        ...prev,
        [key]: urlError,
      }));

      dispatch({ type: ValidationActionType.SetField, field: key, isValid: !urlError });

      onChangeEntity({
        ...entity,
        features: {
          ...(entity.features || {}),
          [key]: value,
        } as DialFeatures,
      });
    },
    [onChangeEntity, entity, t, dispatch],
  );

  return (
    <div className="h-full flex flex-col pt-3 gap-y-9 lg:w-[35%]">
      {textKeys.map((key) => {
        const error = textFieldErrors[key];
        return (
          <TextInputField
            key={key}
            fieldTitle={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
            elementId={key}
            placeholder={t(FeaturesI18nKey[`${key}Placeholder` as keyof typeof FeaturesI18nKey])}
            value={entity.features?.[key] as string}
            errorText={error?.text}
            invalid={!!error}
            onChange={(value) => onChange(value, key)}
          />
        );
      })}

      {switchKeys.map((key) => {
        return (
          <Switch
            key={key}
            isOn={entity?.features?.[key] as boolean}
            title={t(FeaturesI18nKey[key as keyof typeof FeaturesI18nKey])}
            switchId={key}
            onChange={(value) => onSwitch(value, key)}
          />
        );
      })}
    </div>
  );
};

export default EntityFeatures;
