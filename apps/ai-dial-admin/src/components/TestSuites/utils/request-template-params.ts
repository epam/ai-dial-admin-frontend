import { InputBinding, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';

/** Matches ${{name}} or ${{name:defaultValue}} in template strings */
const TEMPLATE_PARAM_REGEX = /\$\{\{([^}:]+)(?::([^}]*))?\}\}/g;

const collectParamsFromString = (str: string): string[] => {
  const names: string[] = [];
  let match: RegExpExecArray | null;
  TEMPLATE_PARAM_REGEX.lastIndex = 0;
  while ((match = TEMPLATE_PARAM_REGEX.exec(str)) !== null) {
    names.push(match[1].trim());
  }
  return names;
};

const collectParamsFromValue = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return collectParamsFromString(value);
  }
  if (value != null && typeof value === 'object' && Array.isArray(value)) {
    return value.flatMap(collectParamsFromValue);
  }
  if (value != null && typeof value === 'object') {
    return Object.values(value).flatMap(collectParamsFromValue);
  }
  return [];
};

/**
 * Extracts all template parameter names from a request template.
 * Parameters match the pattern ${{name}} or ${{name:defaultValue}}.
 */
export const getTemplateParameters = (template: TestSuiteRequestTemplate | undefined): string[] => {
  if (!template) {
    return [];
  }
  const names = collectParamsFromValue(template);
  return [...new Set(names)];
};

export const filterParameterBindings = (
  bindings: InputBinding[] | undefined,
  paramNames: string[],
): InputBinding[] | undefined => {
  if (!bindings?.length || !paramNames.length) {
    return bindings;
  }

  const set = new Set(paramNames);
  return bindings.filter((binding) => set.has(binding.templateVariable));
};
