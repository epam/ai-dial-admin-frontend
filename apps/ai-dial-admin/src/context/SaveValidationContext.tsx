'use client';
import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react';
import { JSONEditorError } from '@/src/types/editor';

export enum ValidationActionType {
  SetField = 'SET_FIELD_VALIDATION',
  SetJsonEditor = 'SET_JSON_EDITOR_VALIDATION',
  Reset = 'RESET',
}

type ValidationAction =
  | { type: ValidationActionType.SetField; field: string; isValid: boolean }
  | { type: ValidationActionType.SetJsonEditor; errors: JSONEditorError[] | null }
  | { type: ValidationActionType.Reset };

interface ValidationState {
  fieldValidations: Map<string, boolean>;
  isValid: boolean;
  jsonErrors: JSONEditorError[] | null;
}

interface SaveValidationContextType {
  isValid: boolean;
  dispatch: Dispatch<ValidationAction>;
  jsonErrors: JSONEditorError[] | null;
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
    case ValidationActionType.SetJsonEditor: {
      return {
        ...state,
        jsonErrors: action.errors,
      };
    }

    case ValidationActionType.Reset: {
      return {
        ...state,
        fieldValidations: new Map(),
        isValid: true,
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
};

const SaveValidationContext = createContext<SaveValidationContextType | undefined>(undefined);

export const SaveValidationContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(validationReducer, initialState);

  return (
    <SaveValidationContext.Provider value={{ isValid: state.isValid, dispatch, jsonErrors: state.jsonErrors }}>
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
