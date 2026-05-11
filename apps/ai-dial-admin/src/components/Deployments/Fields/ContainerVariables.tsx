import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { IconPlus } from '@tabler/icons-react';
import { DialLabel, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { BasicI18nKey, EntityFieldsI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { isEditDisabled, isErrorPresent } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import Variable from '@/src/components/Deployments/Fields/ContainerVariables/Variable';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const ContainerVariables: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const isDisabled = disabled ?? isEditDisabled(container);
  const { errorFields, isValid } = useSaveValidationContext();

  const [isSectionInvalid, setSectionInvalid] = useState(false);

  const variables = useMemo(() => container.metadata?.envs || [], [container]);

  const existingNamesByIndex = useMemo(
    () => variables.map((_, index) => variables.filter((v, i) => i < index && v.name).map((v) => v.name)),
    [variables],
  );

  const onChangeVariables = useCallback(
    (variables: EnvironmentVariable[]) => {
      setContainer({
        ...container,
        metadata: {
          envs: variables,
        },
      });
    },
    [container, setContainer],
  );

  const onAddVariable = useCallback(() => {
    const variableDraft: EnvironmentVariable = {
      name: '',
      description: '',
      value: {
        $type: VALUE_TYPE.SIMPLE,
        value: '',
      },
      mountType: MOUNT_TYPE.CONTENT,
    };

    onChangeVariables([...variables, variableDraft]);
  }, [variables, onChangeVariables]);

  const onUpdateVariable = useCallback(
    (variable: EnvironmentVariable, index: number) => {
      const updatedVariables = variables.map((v, i) => (i === index ? variable : v));
      onChangeVariables(updatedVariables);
    },
    [variables, onChangeVariables],
  );

  const onRemoveVariable = useCallback(
    (index: number) => {
      const updatedVariables = [...variables];
      updatedVariables.splice(index, 1);
      onChangeVariables(updatedVariables);
    },
    [variables, onChangeVariables],
  );

  const findColumn = useCallback(
    (name?: string) => variables.findIndex((variable) => variable.name === name),
    [variables],
  );

  const moveColumn = useCallback(
    (name: string, atIndex: number) => {
      const index = findColumn(name);
      const updatedVariables = [...variables];
      const [removedVariable] = updatedVariables.splice(index, 1);
      updatedVariables.splice(atIndex, 0, removedVariable);
      onChangeVariables(updatedVariables);
    },
    [findColumn, onChangeVariables, variables],
  );

  useEffect(() => {
    if (!isValid) {
      setSectionInvalid(isErrorPresent(errorFields, ['variable_']));
    } else {
      setSectionInvalid(false);
    }
  }, [errorFields, isValid]);

  const gridClassName = classNames(
    'flex flex-col gap-2 overflow-auto',
    'lg:grid lg:grid-cols-[minmax(182px,1.5fr)_minmax(150px,1.5fr)_minmax(248px,3fr)_minmax(208px,1.5fr)] lg:gap-x-4 lg:gap-y-1',
  );

  return (
    <Accordion
      title={t(EntityFieldsI18nKey.EnvironmentVariables)}
      errorIndicator={isSectionInvalid}
      contentPaddingClassName="pb-4"
    >
      <div className="flex flex-col gap-y-2">
        <DndProvider backend={HTML5Backend}>
          <div className={gridClassName}>
            {variables.length > 0 && (
              <>
                <DialLabel label={t(EnvVariablesI18nKey.Name)} className="hidden lg:block lg:pl-8" />
                <DialLabel label={t(EnvVariablesI18nKey.Description)} className="hidden lg:block" />
                <DialLabel label={t(BasicI18nKey.Value)} className="hidden lg:block" />
                <DialLabel label={t(EnvVariablesI18nKey.MountType)} className="hidden lg:block" />
              </>
            )}

            {variables?.map((variable, index) => {
              const handleUpdateVariable = (updatedVariable: EnvironmentVariable) =>
                onUpdateVariable(updatedVariable, index);

              return (
                <Variable
                  key={`variable${index}`}
                  variable={variable}
                  index={index}
                  updateVariable={handleUpdateVariable}
                  removeVariable={onRemoveVariable}
                  findColumn={findColumn}
                  moveColumn={moveColumn}
                  disabled={isDisabled}
                  existingNames={existingNamesByIndex[index]}
                />
              );
            })}
          </div>
        </DndProvider>
        <div>
          <DialNeutralButton
            className="mb-2"
            label={t(EnvVariablesI18nKey.AddVariable)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddVariable}
            disabled={isDisabled}
          />
        </div>
      </div>
    </Accordion>
  );
};

export default ContainerVariables;
