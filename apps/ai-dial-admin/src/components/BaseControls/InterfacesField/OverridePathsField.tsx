'use client';

import { useCallback, useEffect, useState } from 'react';

import { GhostButton, DialInput, DialLabel, DialSelectField, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';

import { OVERRIDE_PATH_OPERATIONS } from '@/src/components/BaseControls/InterfacesField/constants';
import { OverridePathOperation } from '@/src/components/BaseControls/InterfacesField/models';
import { ButtonsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { hasOverridePathIdError, setOverridePath } from '@/src/utils/models/override-paths';
import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';

interface Props {
  fieldId: string;
  type: DeploymentInterfaceType;
  value?: Record<string, string>;
  disabled?: boolean;
  onChange: (value?: Record<string, string>) => void;
}

const NO_OPERATIONS: OverridePathOperation[] = [];
const TOKEN_PARAMS = { id: '{id}', overrideName: '{overrideName}' };

const OverridePathsField = ({ fieldId, type, value, disabled, onChange }: Props) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [isSelecting, setIsSelecting] = useState(false);
  // Operations added in this editor that hold no value yet. An empty path is not part of the entity (it
  // would reach Core as a present, broken path), so a freshly added row lives here until it is filled.
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const operations = OVERRIDE_PATH_OPERATIONS[type] ?? NO_OPERATIONS;
  const isAdded = (operation: OverridePathOperation) =>
    (!!value && operation.key in value) || pendingKeys.includes(operation.key);
  const addedOperations = operations.filter(isAdded);
  const availableOperations = operations.filter((operation) => !isAdded(operation));

  useEffect(() => {
    operations.forEach((operation) =>
      dispatch({
        type: ValidationActionType.SetField,
        field: `${fieldId}-override-${operation.key}`,
        isValid: !hasOverridePathIdError(operation, value?.[operation.key]),
      }),
    );
  }, [dispatch, fieldId, operations, value]);

  useEffect(
    () => () =>
      operations.forEach((operation) =>
        dispatch({ type: ValidationActionType.RemoveField, field: `${fieldId}-override-${operation.key}` }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onAddOperation = useCallback((key: string) => {
    setPendingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setIsSelecting(false);
  }, []);

  const onAddClick = useCallback(() => {
    if (availableOperations.length === 1) {
      onAddOperation(availableOperations[0].key);
    } else {
      setIsSelecting(true);
    }
  }, [availableOperations, onAddOperation]);

  const onChangePath = useCallback(
    (key: string, path?: string) => {
      // Keeps the row on screen when its value is emptied, rather than letting it vanish mid-edit.
      onAddOperation(key);
      onChange(setOverridePath(value, key, path?.trimStart()));
    },
    [value, onChange, onAddOperation],
  );

  const onDeleteOperation = useCallback(
    (key: string) => {
      setPendingKeys((prev) => prev.filter((pendingKey) => pendingKey !== key));
      onChange(setOverridePath(value, key));
    },
    [value, onChange],
  );

  if (!operations.length || (disabled && !addedOperations.length)) {
    return null;
  }

  const showAddButton = !disabled && !isSelecting && availableOperations.length > 0;

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center gap-x-2">
        <DialLabel label={t(InterfacesI18nKey.OverridePaths)} />
        <DialTooltip tooltip={t(InterfacesI18nKey.OverridePathsInfo, TOKEN_PARAMS)}>
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
        </DialTooltip>
      </div>

      {addedOperations.map((operation) => {
        const path = value?.[operation.key] ?? '';
        const hasError = hasOverridePathIdError(operation, path);

        return (
          <div key={operation.key} className="flex items-end gap-x-2">
            <DialInput
              id={`${fieldId}-override-${operation.key}`}
              labelProps={{ label: operation.key }}
              placeholder={operation.defaultPath}
              value={path}
              onChange={(newValue) => onChangePath(operation.key, newValue)}
              disabled={disabled}
              invalid={hasError}
              error={hasError ? t(InterfacesI18nKey.OverridePathIdNotSupported, TOKEN_PARAMS) : undefined}
              containerClassName="w-full"
            />
            {!disabled && (
              <RemoveButton
                aria-label={`${t(ButtonsI18nKey.Delete)} ${operation.key}`}
                onClick={() => onDeleteOperation(operation.key)}
              />
            )}
          </div>
        );
      })}

      {!disabled && isSelecting && (
        <DialSelectField
          id={`${fieldId}-override-select`}
          containerClassName="max-w-[300px]"
          placeholder={t(InterfacesI18nKey.SelectOverridePath)}
          options={availableOperations.map((operation) => ({ value: operation.key, label: operation.key }))}
          value=""
          onChange={(key) => onAddOperation(key as string)}
        />
      )}

      {showAddButton && (
        <div className="flex justify-start">
          <GhostButton
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            label={t(ButtonsI18nKey.AddOverridePath)}
            onClick={onAddClick}
          />
        </div>
      )}
    </div>
  );
};

export default OverridePathsField;
