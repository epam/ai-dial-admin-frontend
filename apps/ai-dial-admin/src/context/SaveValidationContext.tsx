'use client';
import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react';

export enum ValidationActionType {
  SetField = 'SET_FIELD_VALIDATION',
  Reset = 'RESET',
}

type ValidationAction =
  | { type: ValidationActionType.SetField; field: string; isValid: boolean }
  | { type: ValidationActionType.Reset };

interface ValidationState {
  fieldValidations: Map<string, boolean>;
  isValid: boolean;
}

interface SaveValidationContextType {
  isValid: boolean;
  dispatch: Dispatch<ValidationAction>;
}

const validationReducer = (state: ValidationState, action: ValidationAction): ValidationState => {
  console.log('Validation for field:', state);
  switch (action.type) {
    case ValidationActionType.SetField: {
      const newFieldValidations = new Map(state.fieldValidations);
      newFieldValidations.set(action.field, action.isValid);

      const isValid = Array.from(newFieldValidations.values()).every((valid) => valid);

      return {
        fieldValidations: newFieldValidations,
        isValid,
      };
    }
    case ValidationActionType.Reset: {
      return {
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
};

const SaveValidationContext = createContext<SaveValidationContextType | undefined>(undefined);

export const SaveValidationContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(validationReducer, initialState);

  return (
    <SaveValidationContext.Provider value={{ isValid: state.isValid, dispatch }}>
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
