import {
  InputBinding,
  InputBindingRowData,
  TemplateVariable,
  TestCaseSchema,
  TestSuite,
} from '@/src/models/evaluation/test-suite';
import { InputBindingType } from '@/src/types/evaluation';

/** Shared fields from `data`, per-turn fields from that turn's map only (grid scope rule). */
export const buildTurnEffectiveData = (
  data: Record<string, unknown> | undefined,
  turnData: Record<string, unknown> | undefined,
  perTurnFields: Set<string>,
): Record<string, unknown> => {
  const effective: Record<string, unknown> = {};

  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (!perTurnFields.has(key)) {
        effective[key] = value;
      }
    }
  }

  if (turnData) {
    for (const [key, value] of Object.entries(turnData)) {
      if (perTurnFields.has(key)) {
        effective[key] = value;
      }
    }
  }

  return effective;
};

export const perTurnFieldNames = (schema: TestCaseSchema[] | undefined): Set<string> =>
  new Set((schema ?? []).filter((field) => field.perTurn).map((field) => field.name));

/**
 * Resolve template variables for one turn: constant → dataField → variable name → default → null.
 */
export const resolveVariablesForTurn = (
  variables: TemplateVariable[],
  bindings: InputBinding[],
  effectiveData: Record<string, unknown>,
): TemplateVariable[] => {
  const bindingByVar = new Map(bindings.map((b) => [b.templateVariable, b]));

  return variables.map((variable) => {
    const binding = bindingByVar.get(variable.name);
    let resolvedValue: unknown = null;

    if (binding?.constantValue != null) {
      resolvedValue = binding.constantValue;
    } else if (binding?.dataField != null && binding.dataField !== '' && binding.dataField in effectiveData) {
      resolvedValue = effectiveData[binding.dataField];
    } else if (variable.name in effectiveData) {
      resolvedValue = effectiveData[variable.name];
    } else if (variable.hasDefault) {
      resolvedValue = variable.defaultValue;
    }

    return { ...variable, resolvedValue };
  });
};

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
      value: binding?.constantValue != null ? binding.constantValue : (variable.defaultValue ?? ''),
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
      value: binding != null ? binding : (variable.resolvedValue ?? variable.defaultValue ?? ''),
      defaultValue: variable.defaultValue,
    };
  });
};

export const convertVariableIntoInitialRequest = (variables: TemplateVariable[]): Record<string, unknown> => {
  const requestVariables: Record<string, unknown> = {};
  variables.forEach((variable) => {
    requestVariables[variable.name] = variable.defaultValue ?? variable.resolvedValue ?? '';
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

const hasBindingValue = (binding: InputBinding): boolean => {
  const hasDataField = binding.dataField != null && binding.dataField !== '';
  const hasConstantValue = binding.constantValue != null;
  return hasDataField || hasConstantValue;
};

/** True when any request binding is in Attribute mode with no attribute (or otherwise has neither side set). */
export const hasIncompleteInputBindings = (suite: TestSuite): boolean => {
  const bindings = [
    ...(suite.inputBindings ?? []),
    ...(suite.additionalRequests?.flatMap((request) => request.inputBindings ?? []) ?? []),
  ];
  return bindings.some((binding) => !hasBindingValue(binding));
};
