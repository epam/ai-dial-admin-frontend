import { InputBinding, InputBindingRowData, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { InputBindingType } from '@/src/types/evaluation';

export const generateInputBindingsRowData = (
  variables: TemplateVariable[],
  bindings: InputBinding[],
): InputBindingRowData[] => {
  return variables.map((variable) => {
    const binding = bindings.find((b) => b.templateVariable === variable.name);

    if (binding?.dataField != null) {
      return {
        templateVariable: variable.name,
        effectiveType: variable.effectiveType,
        dataField: binding.dataField,
        type: InputBindingType.Attribute,
        value: binding.dataField,
        defaultValue: variable.defaultValue,
      };
    }

    return {
      templateVariable: variable.name,
      effectiveType: variable.effectiveType,
      constantValue: binding?.constantValue,
      type: InputBindingType.Constant,
      value: binding?.constantValue ?? variable.defaultValue ?? '',
      defaultValue: variable.defaultValue,
    };
  });
};

export const generateVariablesRowData = (
  variables: TemplateVariable[],
  requestBody: Record<string, unknown>,
): InputBindingRowData[] => {
  return variables.map((variable) => {
    const binding = requestBody[variable.name];
    return {
      templateVariable: variable.name,
      effectiveType: variable.effectiveType,
      value: variable.resolvedValue ?? binding ?? '',
      defaultValue: variable.defaultValue,
    };
  });
};

export const convertVariableIntoInitialRequest = (variables: TemplateVariable[]): Record<string, unknown> => {
  const requestVariables: Record<string, unknown> = {};
  variables.forEach((variable) => {
    requestVariables[variable.name] = variable.defaultValue ?? '';
  });
  return requestVariables;
};

export const generateInputBinding = (binding: InputBinding, field: string, value: string): InputBinding => {
  const newBinding: InputBinding = { ...binding };
  if (field === 'type') {
    if (value === InputBindingType.Attribute) {
      newBinding.constantValue = void 0;
      newBinding.dataField = '';
    } else {
      newBinding.constantValue = '';
      newBinding.dataField = void 0;
    }
  } else {
    newBinding.dataField = value;
  }
  return newBinding;
};
