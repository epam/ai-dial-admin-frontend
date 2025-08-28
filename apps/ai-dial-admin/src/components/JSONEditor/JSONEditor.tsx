import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { clearResolvedErrors } from '@/src/components/JSONEditor/utils';
import { useNotification } from '@/src/context/NotificationContext';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

interface Props<T> {
  entity: T;
  errorNotifications: JSONEditorErrorNotification[];
  setSelectedEntity: Dispatch<SetStateAction<T>>;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setJsonErrors?: Dispatch<SetStateAction<JSONEditorError[]>>;
}

const JSONEditor = <T extends object>({
  entity,
  errorNotifications,
  setSelectedEntity,
  setIsChanged,
  setJsonErrors,
}: Props<T>) => {
  const { removeNotification } = useNotification();
  const [entityModel, setEntityModel] = useState<string>('');

  useEffect(() => {
    if (entity) {
      setEntityModel(JSON.stringify(entity, null, 4));
    }
  }, [entity, setEntityModel]);

  const onChangeJSON = useCallback(
    (updatedConfig?: string) => {
      if (updatedConfig) {
        try {
          setSelectedEntity(JSON.parse(updatedConfig));
        } catch (error) {
          if (error) {
            setIsChanged?.(true);
          }
        }
      }
    },
    [setSelectedEntity, setIsChanged],
  );

  const onValidateJSON = useCallback(
    (errors?: JSONEditorError[]) => {
      // 768 - validation $schema field. $schema uses in App Runner and it'e not real JSON scheme
      const filteredErrors = errors?.filter((error) => error.code !== '768');
      clearResolvedErrors({ errorNotifications, errors: filteredErrors, removeNotification });
      setJsonErrors?.(filteredErrors ?? []);
    },
    [setJsonErrors, errorNotifications, removeNotification],
  );

  if (!entityModel) {
    return null;
  }

  return <JsonEditorBase value={entityModel} onChange={onChangeJSON} onValidateJSON={onValidateJSON} />;
};

export default JSONEditor;
