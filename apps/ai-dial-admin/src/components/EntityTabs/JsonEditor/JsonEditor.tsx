'use client';

import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { editor } from 'monaco-editor';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { clearResolvedErrors } from '@/src/components/EntityTabs/JsonEditor/utils';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { JSONEditorError } from '@/src/types/editor';

interface Props<T> {
  entity: T | null;
  setSelectedEntity?: Dispatch<SetStateAction<T>>;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  readonly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
}

const EntityJsonEditor = <T extends object>({
  entity,
  setSelectedEntity,
  setIsChanged,
  readonly,
  options,
}: Props<T>) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch, jsonErrorNotifications } = useSaveValidationContext();
  const { removeNotification } = useNotification();
  const [entityModel, setEntityModel] = useState<string>('');

  const setJsonErrors = useCallback(
    (errors: JSONEditorError[]) => {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors });
    },
    [dispatch],
  );

  useEffect(() => {
    if (entity) {
      setEntityModel(JSON.stringify(entity, null, 4));
    }
  }, [entity, setEntityModel]);

  const onChangeJSON = useCallback(
    (updatedConfig?: string) => {
      if (updatedConfig) {
        try {
          setSelectedEntity?.(JSON.parse(updatedConfig));
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
      clearResolvedErrors(jsonErrorNotifications, removeNotification, filteredErrors);
      setJsonErrors?.(filteredErrors ?? []);
    },
    [setJsonErrors, jsonErrorNotifications, removeNotification],
  );

  if (!entityModel) {
    return null;
  }

  return (
    <JsonEditorBase
      value={entityModel}
      onChange={onChangeJSON}
      onValidateJSON={onValidateJSON}
      options={{
        ...(options ?? {}),
        ...(readonly || isReadOnlyAdmin ? { readOnly: true } : {}),
      }}
    />
  );
};

export default EntityJsonEditor;
