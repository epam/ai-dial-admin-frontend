'use client';

import { DialRemoveButton, DialSelectField, DialInput } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight, IconGripVertical } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';

import { mountTypeDropdownItems } from '@/src/constants/deployments/variables';
import { EntityPlaceholdersI18nKey, EnvVariablesI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { EnvironmentVariable, EnvVariableValue } from '@/src/models/deployments/variables';
import { FieldError } from '@/src/models/error';
import { MOUNT_TYPE } from '@/src/types/deployments/variables';
import { getVariableNameError } from '@/src/utils/deployments/validation';
import Value from '@/src/components/Deployments/Fields/ContainerVariables/Value';
import { useColumnDragDrop } from '@/src/components/Deployments/Fields/ContainerVariables/use-column-drag-drop';

interface Props {
  index: number;
  variable: EnvironmentVariable;
  updateVariable: (variable: EnvironmentVariable) => void;
  removeVariable: (index: number) => void;
  findColumn?: (name: string) => number;
  moveColumn?: (name: string, atIndex: number) => void;
  disabled?: boolean;
  existingNames?: string[];
}

const Variable: FC<Props> = ({
  index,
  variable,
  updateVariable,
  removeVariable,
  findColumn,
  moveColumn,
  disabled,
  existingNames,
}) => {
  const t = useI18n();
  const isTablet = useIsTabletScreen();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const mountTypeItems = mountTypeDropdownItems(t);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [variableNameError, setVariableNameError] = useState<FieldError | null>(null);

  const { dragRef, dropRef, isDragging } = useColumnDragDrop({
    id: variable.name || '',
    findColumn,
    moveColumn,
  });

  useEffect(() => {
    const error = getVariableNameError(variable.name as string, t, existingNames);
    dispatch({
      type: ValidationActionType.SetField,
      field: `variable_${index}`,
      isValid: !error,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter || (variable.name != null && variable.name?.length > 0)) {
      const error = getVariableNameError(variable.name as string, t, existingNames);
      setVariableNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: `variable_${index}`,
        isValid: !error,
      });
    }
  }, [dispatch, existingNames, index, resetCounter, t, variable.name]);

  const onRemove = useCallback(() => {
    removeVariable(index);
  }, [index, removeVariable]);

  const onChangeName = useCallback(
    (name?: string) => {
      const error = getVariableNameError(name as string, t, existingNames);
      dispatch({
        type: ValidationActionType.SetField,
        field: `variable_${index}`,
        isValid: !error,
      });
      setVariableNameError(error);
      updateVariable({ ...variable, name: name as string });
    },
    [dispatch, existingNames, index, t, updateVariable, variable],
  );

  const onChangeDescription = useCallback(
    (description?: string) => {
      updateVariable({ ...variable, description: description as string });
    },
    [variable, updateVariable],
  );

  const onChangeMountType = useCallback(
    (mountType: string | string[]) => {
      updateVariable({
        ...variable,
        mountType: mountType as MOUNT_TYPE,
      });
    },
    [updateVariable, variable],
  );

  const onValueChange = useCallback(
    (value: EnvVariableValue) => {
      updateVariable({ ...variable, value });
    },
    [updateVariable, variable],
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const mobileLabel = (key: EnvVariablesI18nKey | BasicI18nKey) => (isTablet ? { label: t(key) } : undefined);

  const hideOnMobileCollapsed = isTablet && isCollapsed;

  return (
    <div
      ref={dropRef}
      className={classNames(
        'relative flex flex-row gap-2 lg:grid lg:grid-cols-subgrid lg:col-span-4 lg:gap-x-4 lg:items-start',
        index > 0 && 'lg:mt-1',
      )}
      style={{ opacity: isDragging ? 0 : 1 }}
    >
      <div className="flex min-w-0 flex-1 flex-col rounded border border-primary p-3 lg:contents">
        {isTablet && (
          <div className="flex flex-col justify-center cursor-pointer lg:hidden" onClick={toggleCollapse}>
            <h3 className="small flex items-center">
              <i className="text-icon-primary mr-2">
                {isCollapsed ? (
                  <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
                ) : (
                  <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
                )}
              </i>
              {t(EnvVariablesI18nKey.EnvVariable)} {index + 1}
            </h3>
            {isCollapsed && (
              <p className="max-w-[220px] md:max-w-1/2 truncate tiny text-secondary mt-3">{variable.name}</p>
            )}
          </div>
        )}

        <div
          className={classNames(
            'flex flex-row items-center gap-x-2 mt-4 lg:mt-0 lg:contents',
            hideOnMobileCollapsed && 'hidden',
          )}
        >
          <div className="flex-1 min-w-0 flex flex-col gap-y-4 lg:contents">
            <div className="flex flex-row gap-x-2 items-end lg:items-start">
              <div
                ref={dragRef}
                className="hidden lg:flex lg:items-center lg:h-10 cursor-move text-secondary"
                aria-label="Drag to reorder"
              >
                <IconGripVertical {...BASE_BUTTON_ICON_PROPS} />
              </div>
              <div className="flex-1 min-w-0">
                <DialInput
                  id={`name ${index}`}
                  value={variable.name}
                  placeholder={t(EntityPlaceholdersI18nKey.Name)}
                  labelProps={mobileLabel(EnvVariablesI18nKey.Name)}
                  aria-label={t(EnvVariablesI18nKey.Name)}
                  error={variableNameError?.text}
                  invalid={!!variableNameError}
                  required
                  onChange={onChangeName}
                  disabled={disabled}
                />
              </div>
            </div>

            <DialInput
              id={`description ${index}`}
              value={variable.description}
              placeholder={t(EntityPlaceholdersI18nKey.Description)}
              labelProps={mobileLabel(EnvVariablesI18nKey.Description)}
              aria-label={t(EnvVariablesI18nKey.Description)}
              onChange={onChangeDescription}
              disabled={disabled}
            />

            <Value
              value={variable.value}
              onValueChange={onValueChange}
              index={index}
              mountType={variable.mountType}
              disabled={disabled}
              fieldName={isTablet ? t(BasicI18nKey.Value) : undefined}
              ariaLabel={t(BasicI18nKey.Value)}
            />

            <div className="flex flex-row gap-x-2 items-end">
              <div className="flex-1 min-w-0">
                <DialSelectField
                  value={variable.mountType || mountTypeItems[0].value}
                  id={`mountType_${index}`}
                  options={mountTypeItems}
                  label={isTablet ? t(EnvVariablesI18nKey.MountType) : undefined}
                  aria-label={t(EnvVariablesI18nKey.MountType)}
                  onChange={onChangeMountType}
                  disabled={disabled}
                />
              </div>
              <div className="hidden lg:flex">
                <DialRemoveButton onClick={onRemove} disabled={disabled} />
              </div>
            </div>
          </div>
          <div className="lg:hidden">
            <DialRemoveButton onClick={onRemove} disabled={disabled} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Variable;
