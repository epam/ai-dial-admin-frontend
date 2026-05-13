'use client';
import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';

export enum ValidationActionType {
  SetField = 'SET_FIELD_VALIDATION',
  RemoveField = 'REMOVE_FIELD_VALIDATION',
  SetJsonEditor = 'SET_JSON_EDITOR_VALIDATION',
  SetJsonEditorNotifications = 'SET_JSON_EDITOR_NOTIFICATIONS',
  Reset = 'RESET',
}

type ValidationAction =
  | { type: ValidationActionType.SetField; field: string; isValid: boolean }
  | { type: ValidationActionType.RemoveField; field: string }
  | { type: ValidationActionType.SetJsonEditor; errors: JSONEditorError[] | null }
  | { type: ValidationActionType.SetJsonEditorNotifications; errors: JSONEditorErrorNotification[] }
  | { type: ValidationActionType.Reset };

interface ValidationState {
  fieldValidations: Map<string, boolean>;
  isValid: boolean;
  jsonErrors: JSONEditorError[] | null;
  jsonErrorNotifications: JSONEditorErrorNotification[];
  resetCounter: number;
}

interface SaveValidationContextType {
  isValid: boolean;
  dispatch: Dispatch<ValidationAction>;
  jsonErrorNotifications: JSONEditorErrorNotification[];
  jsonErrors: JSONEditorError[] | null;
  resetCounter: number;
  errorFields: Map<string, boolean>;
}

const validationReducer = (state: ValidationState, action: ValidationAction): ValidationState => {
  switch (action.type) {
    case ValidationActionType.SetField: {
      const newFieldValidations = new Map(state.fieldValidations);
      newFieldValidations.set(action.field, action.isValid);

      const isValid = Array.from(newFieldValidations.values()).every((valid) => valid);

      return {
        ...state,
        fieldValidations: newFieldValidations,
        isValid,
      };
    }
    case ValidationActionType.RemoveField: {
      const newFieldValidations = new Map(state.fieldValidations);
      newFieldValidations.delete(action.field);

      const isValid =
        newFieldValidations.size === 0 || Array.from(newFieldValidations.values()).every((valid) => valid);

      return {
        ...state,
        fieldValidations: newFieldValidations,
        isValid,
      };
    }
    case ValidationActionType.SetJsonEditor: {
      return {
        ...state,
        jsonErrors: action.errors,
      };
    }

    case ValidationActionType.SetJsonEditorNotifications: {
      return {
        ...state,
        jsonErrorNotifications: action.errors,
      };
    }

    case ValidationActionType.Reset: {
      return {
        ...state,
        jsonErrors: null,
        fieldValidations: new Map(),
        isValid: true,
        resetCounter: state.resetCounter + 1,
      };
    }
    default:
      return state;
  }
};

const initialState: ValidationState = {
  fieldValidations: new Map(),
  isValid: true,
  jsonErrors: [],
  jsonErrorNotifications: [],
  resetCounter: 0,
};

const SaveValidationContext = createContext<SaveValidationContextType | undefined>(undefined);

export const SaveValidationContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(validationReducer, initialState);

  return (
    <SaveValidationContext.Provider
      value={{
        isValid: state.isValid,
        jsonErrorNotifications: state.jsonErrorNotifications,
        dispatch,
        jsonErrors: state.jsonErrors,
        resetCounter: state.resetCounter,
        errorFields: state.fieldValidations,
      }}
    >
      {children}
    </SaveValidationContext.Provider>
  );
};

export const useSaveValidationContext = () => {
  const context = useContext(SaveValidationContext);

  if (!context) {
    throw new Error('SaveValidationContext must be used within a <SaveValidationContextProvider />');
  }

  return context;
};
