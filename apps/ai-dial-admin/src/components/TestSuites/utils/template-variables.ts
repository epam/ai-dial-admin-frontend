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
      value: binding?.constantValue ?? '',
      defaultValue: variable.defaultValue,
    };
  });
};
