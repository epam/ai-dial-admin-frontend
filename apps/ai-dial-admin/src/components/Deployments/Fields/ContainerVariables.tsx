import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { IconPlus } from '@tabler/icons-react';
import { DialNeutralButton } from '@epam/ai-dial-ui-kit';

import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { EntityFieldsI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';
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
}

const ContainerVariables: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { errorFields, isValid } = useSaveValidationContext();

  const [isSectionInvalid, setSectionInvalid] = useState(false);

  const variables = useMemo(() => container.metadata?.envs || [], [container]);

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

  return (
    <Accordion title={t(EntityFieldsI18nKey.EnvironmentVariables)} errorIndicator={isSectionInvalid}>
      <div className="flex flex-col gap-y-2">
        <DndProvider backend={HTML5Backend}>
          <div className="flex flex-col gap-2 lg:pr-2 overflow-auto">
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
                  disabled={isEditDisabled(container)}
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
            disabled={isEditDisabled(container)}
          />
        </div>
      </div>
    </Accordion>
  );
};

export default ContainerVariables;
