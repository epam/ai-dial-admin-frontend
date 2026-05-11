import { FC, memo, useCallback } from 'react';
import { DialPasswordInput, DialInput } from '@epam/ai-dial-ui-kit';

import { EnvVariableValue } from '@/src/models/deployments/variables';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { useI18n } from '@/src/locales/client';

import ValueFile from '@/src/components/Deployments/Fields/ContainerVariables/ValueFile';

interface Props {
  value: EnvVariableValue;
  onValueChange: (value: EnvVariableValue) => void;
  index: number;
  mountType?: MOUNT_TYPE;
  disabled?: boolean;
  fieldName?: string;
  ariaLabel?: string;
}

const ContainerVariableValue: FC<Props> = ({
  value,
  index,
  onValueChange,
  mountType,
  disabled,
  fieldName,
  ariaLabel,
}) => {
  const t = useI18n();

  const onChangeValue = useCallback(
    (newValue?: string) => {
      onValueChange({
        ...value,
        value: newValue,
      });
    },
    [onValueChange, value],
  );

  const isSecure = mountType === MOUNT_TYPE.SECURE_CONTENT || mountType === MOUNT_TYPE.SECURE_FILE;

  return (
    <div className="flex-1 min-w-0">
      {value.$type === VALUE_TYPE.SIMPLE &&
        (isSecure ? (
          <DialPasswordInput
            id={`value_${index}`}
            value={value.value}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            labelProps={fieldName ? { label: fieldName } : undefined}
            aria-label={ariaLabel}
            onChange={onChangeValue}
            disabled={disabled}
          />
        ) : (
          <DialInput
            id={`value_${index}`}
            value={value.value}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            labelProps={fieldName ? { label: fieldName } : undefined}
            aria-label={ariaLabel}
            onChange={onChangeValue}
            disabled={disabled}
          />
        ))}
      {value.$type === VALUE_TYPE.FILE && (
        <ValueFile
          value={value}
          index={index}
          fieldName={fieldName}
          ariaLabel={ariaLabel}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default memo(ContainerVariableValue);
