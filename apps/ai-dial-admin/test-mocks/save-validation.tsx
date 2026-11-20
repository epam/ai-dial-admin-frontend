import { ReactNode, useCallback, useId } from 'react';
import { vi } from 'vitest';
import type * as SaveValidationModule from '@/src/context/SaveValidationContext';
import type { JSONEditorError, JsonEditorOwnedError } from '@/src/types/editor';

type SaveValidationValue = ReturnType<typeof SaveValidationModule.useSaveValidationContext>;

const dispatch = vi.fn<SaveValidationValue['dispatch']>();

const createDefaultValue = (): SaveValidationValue => ({
  isValid: true,
  dispatch,
  jsonErrors: [],
  jsonErrorNotifications: [],
  resetCounter: 0,
  errorFields: new Map(),
});

let value = createDefaultValue();

export const saveValidationMock = {
  dispatch,
  set(overrides: Partial<SaveValidationValue>) {
    value = { ...value, ...overrides };
  },
  reset() {
    dispatch.mockReset();
    value = createDefaultValue();
  },
};

export const createSaveValidationModule = (actual: typeof SaveValidationModule): typeof SaveValidationModule => ({
  ...actual,
  SaveValidationContextProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useSaveValidationContext: () => value,
  useJsonEditorValidation: () => {
    const editorId = useId();
    const setJsonErrors = useCallback(
      (errors: JSONEditorError[]) => {
        const ownedErrors: JsonEditorOwnedError[] = errors.map((error) => ({ ...error, editorId }));
        value.dispatch({ type: actual.ValidationActionType.SetJsonEditor, editorId, errors: ownedErrors });
      },
      [editorId],
    );
    const removeEditor = useCallback(
      () => value.dispatch({ type: actual.ValidationActionType.RemoveJsonEditor, editorId }),
      [editorId],
    );
    return { editorId, setJsonErrors, removeEditor };
  },
});
