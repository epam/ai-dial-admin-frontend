'use client';

import { DialRemoveButton, DialSelectField, DialInput } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { mountTypeDropdownItems } from '@/src/constants/deployments/variables';
import { EntityPlaceholdersI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { EnvironmentVariable, EnvVariableValue } from '@/src/models/deployments/variables';
import { FieldError } from '@/src/models/error';
import { MOUNT_TYPE } from '@/src/types/deployments/variables';
import { getVariableNameError } from '@/src/utils/deployments/validation';
import Value from '@/src/components/Deployments/Fields/ContainerVariables/Value';

interface Props {
  index: number;
  variable: EnvironmentVariable;
  updateVariable: (variable: EnvironmentVariable) => void;
  removeVariable: (index: number) => void;
  findColumn?: (name: string) => number;
  moveColumn?: (name: string, atIndex: number) => void;
  disabled?: boolean;
}

const Variable: FC<Props> = ({ index, variable, updateVariable, removeVariable, findColumn, moveColumn, disabled }) => {
  const t = useI18n();
  const isTablet = useIsTabletScreen();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const mountTypeItems = mountTypeDropdownItems(t);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [variableNameError, setVariableNameError] = useState<FieldError | null>(null);

  useEffect(() => {
    const error = getVariableNameError(variable.name as string, t);
    dispatch({
      type: ValidationActionType.SetField,
      field: `variable_${index}`,
      isValid: !error,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter || (variable.name != null && variable.name?.length > 0)) {
      const error = getVariableNameError(variable.name as string, t);
      setVariableNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: `variable_${index}`,
        isValid: !error,
      });
    }
  }, [dispatch, index, resetCounter, t, variable.name]);

  const onRemove = useCallback(() => {
    removeVariable(index);
  }, [index, removeVariable]);

  const onChangeName = useCallback(
    (name?: string) => {
      const error = getVariableNameError(name as string, t);
      dispatch({
        type: ValidationActionType.SetField,
        field: `variable_${index}`,
        isValid: !error,
      });
      setVariableNameError(error);
      updateVariable({ ...variable, name: name as string });
    },
    [dispatch, index, t, updateVariable, variable],
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

  return (
    <DraggableItem id={variable.name || ''} findItem={findColumn} moveItem={moveColumn}>
      <div className="flex flex-row gap-2 flex-1 relative">
        <div className="flex min-w-0 flex-1 flex-col rounded border border-primary p-3 lg:border-none lg:p-0 lg:flex-initial">
          {isTablet && (
            <div className="flex flex-col justify-center cursor-pointer" onClick={toggleCollapse}>
              <h3 className="small flex items-center">
                <i className="text-icon-primary mr-2 ">
                  {isCollapsed ? (
                    <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
                  ) : (
                    <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
                  )}
                </i>
                {t(EnvVariablesI18nKey.EnvVariable)} {index + 1}
              </h3>
              {isCollapsed && (
                <p className="max-w-[220px] md:max-w-[50%] truncate tiny text-secondary mt-3">{variable.name}</p>
              )}
            </div>
          )}
          <div
            className={classNames('flex flex-col mt-4 gap-y-4 lg:flex-row lg:gap-x-4 lg:mt-0', isCollapsed && 'hidden')}
          >
            <DialInput
              id={`name ${index}`}
              value={variable.name}
              placeholder={t(EntityPlaceholdersI18nKey.Name)}
              labelProps={{ label: index === 0 ? t(EnvVariablesI18nKey.Name) : '' }}
              error={variableNameError?.text}
              invalid={!!variableNameError}
              required
              className="min-w-[100px]"
              onChange={onChangeName}
              disabled={disabled}
            />
            <DialInput
              id={`description ${index}`}
              className="min-w-[150px]"
              value={variable.description}
              placeholder={t(EntityPlaceholdersI18nKey.Description)}
              labelProps={{ label: index === 0 ? t(EnvVariablesI18nKey.Description) : '' }}
              onChange={onChangeDescription}
              disabled={disabled}
            />
            <div className="lg:min-w-[350px] lg:max-w-[350px]">
              <Value
                value={variable.value}
                onValueChange={onValueChange}
                index={index}
                mountType={variable.mountType}
                disabled={disabled}
              />
            </div>
            <DialSelectField
              className="min-w-[160px]"
              value={variable.mountType || mountTypeItems[0].value}
              id="mountType"
              options={mountTypeItems}
              label={index === 0 ? t(EnvVariablesI18nKey.MountType) : ''}
              onChange={onChangeMountType}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="w-[40px] flex-shrink-0">
          <DialRemoveButton onClick={onRemove} className={index === 0 ? 'mt-3 lg:mt-6' : ''} disabled={disabled} />
        </div>
      </div>
    </DraggableItem>
  );
};

export default Variable;
