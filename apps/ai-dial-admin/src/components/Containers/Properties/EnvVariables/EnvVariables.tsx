import { FC, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { IconPlus } from '@tabler/icons-react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import EnvVariable from './EnvVariable';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { useI18n } from '@/src/locales/client';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { EnvVariablesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  variables: EnvironmentVariable[];
  onChangeVariables: (variables: EnvironmentVariable[]) => void;
}

const EnvVariables: FC<Props> = ({ variables, onChangeVariables }) => {
  const t = useI18n() as (key: string) => string;

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

  return (
    <div className="flex flex-col gap-y-2">
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col gap-2 lg:pr-2">
          {variables?.map((variable, index) => {
            const handleUpdateVariable = (updatedVariable: EnvironmentVariable) =>
              onUpdateVariable(updatedVariable, index);

            return (
              <EnvVariable
                key={`variable${index}`}
                variable={variable}
                index={index}
                numVariables={variables?.length || 0}
                updateVariable={handleUpdateVariable}
                removeVariable={onRemoveVariable}
                findColumn={findColumn}
                moveColumn={moveColumn}
              />
            );
          })}
        </div>
      </DndProvider>
      <div>
        <DialButton
          variant={ButtonVariant.Secondary}
          className="mb-2"
          label={t(EnvVariablesI18nKey.AddVariable)}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          onClick={onAddVariable}
        />
      </div>
    </div>
  );
};

export default EnvVariables;
