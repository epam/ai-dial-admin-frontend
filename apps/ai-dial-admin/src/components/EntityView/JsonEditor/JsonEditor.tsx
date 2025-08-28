'use client';

import { Dispatch, SetStateAction, useCallback } from 'react';

import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props<T> {
  entity: T;
  errorNotifications: JSONEditorErrorNotification[];
  setSelectedEntity: Dispatch<SetStateAction<T>>;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
}

const EntityJsonEditor = <T extends object>({ ...props }: Props<T>) => {
  const { dispatch } = useSaveValidationContext();

  const setJsonErrors = useCallback(
    (errors: JSONEditorError[]) => {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors });
    },
    [dispatch],
  );

  return <JSONEditor setJsonErrors={setJsonErrors} {...props} />;
};

export default EntityJsonEditor;
