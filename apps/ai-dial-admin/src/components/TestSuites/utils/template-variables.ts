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
        inferredType: variable.inferredType,
        dataField: binding.dataField,
        type: InputBindingType.Attribute,
        value: binding.dataField,
        defaultValue: variable.defaultValue,
      };
    }

    return {
      templateVariable: variable.name,
      inferredType: variable.inferredType,
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
      inferredType: variable.inferredType,
      value: binding ?? '',
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
