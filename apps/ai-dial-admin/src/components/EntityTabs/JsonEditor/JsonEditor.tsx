'use client';

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import type { editor } from 'monaco-editor';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { clearResolvedErrors, mergeWithIgnoredFields } from '@/src/components/EntityTabs/JsonEditor/utils';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { JSONEditorError } from '@/src/types/editor';

interface Props<T> {
  entity: T | null;
  setSelectedEntity?: Dispatch<SetStateAction<T>>;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  ignoredFields?: (keyof T)[];
  readonly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
  text?: string;
  onChangeText?: (text: string) => void;
}

const EntityJsonEditor = <T extends object>({
  entity,
  setSelectedEntity,
  setIsChanged,
  ignoredFields,
  readonly,
  options,
  text,
  onChangeText,
}: Props<T>) => {
  const isTextControlled = text !== undefined;
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch, jsonErrorNotifications } = useSaveValidationContext();
  const { removeNotification } = useNotification();
  const [entityModel, setEntityModel] = useState<string>('');
  /** Remount Monaco when `entity` is reset externally (e.g. discard) so the editor reflects the new value. */
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);
  /** Avoid resetting Monaco text when `entity` updates from our own JSON parse — that resets the cursor. */
  const lastEntityFromEditorRef = useRef<T | null>(null);

  const setJsonErrors = useCallback(
    (errors: JSONEditorError[]) => {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors });
    },
    [dispatch],
  );

  useEffect(() => {
    if (isTextControlled) {
      return;
    }
    if (!entity) {
      return;
    }
    if (entity === lastEntityFromEditorRef.current) {
      return;
    }
    lastEntityFromEditorRef.current = entity;
    setEntityModel(JSON.stringify(entity, null, 4));
    setEditorInstanceKey((key) => key + 1);
  }, [entity, isTextControlled]);

  const onChangeJSON = useCallback(
    (updatedConfig?: string) => {
      onChangeText?.(updatedConfig ?? '');
      if (!updatedConfig) {
        return;
      }
      try {
        const parsed = JSON.parse(updatedConfig);
        if (setSelectedEntity) {
          const merged = mergeWithIgnoredFields(entity as T, parsed, ignoredFields);
          lastEntityFromEditorRef.current = merged;
          setSelectedEntity(merged);
        }
      } catch (error) {
        if (error) {
          setIsChanged?.(true);
        }
      }
    },
    [onChangeText, setSelectedEntity, entity, ignoredFields, setIsChanged],
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

  if (!isTextControlled && !entityModel) {
    return null;
  }

  return (
    <JsonEditorBase
      key={editorInstanceKey}
      value={isTextControlled ? text : entityModel}
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
