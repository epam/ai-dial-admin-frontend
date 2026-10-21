import { TEMPLATE_VARIABLE_TYPE_BY_HINT } from '@/src/components/TestSuites/utils/constants';
import { ParsedTemplateParam } from '@/src/components/TestSuites/utils/models';
import { InputBinding, TemplateVariable, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

/**
 * Matches all four documented placeholder forms — `${{name}}`, `${{name:default}}`, `${{name|type}}`
 * and `${{name|type:default}}` (see `RequestTemplate/components/constants.ts`). The name stops at `|`
 * and `:` so a type hint can never leak into it, which is what made a `${{file|file}}` placeholder bind
 * against the variable `file|file`; the default is free text and may contain both.
 */
const TEMPLATE_PARAM_REGEX = /\$\{\{\s*([^}|:]+?)\s*(?:\|\s*([^}|:]*?)\s*)?(?::([^}]*))?\}\}/g;

const collectParamsFromString = (str: string): ParsedTemplateParam[] => {
  const params: ParsedTemplateParam[] = [];
  let match: RegExpExecArray | null;
  TEMPLATE_PARAM_REGEX.lastIndex = 0;
  while ((match = TEMPLATE_PARAM_REGEX.exec(str)) !== null) {
    const [, name, typeHint, defaultValue] = match;
    const hasDefault = defaultValue !== undefined;
    params.push({
      name: name.trim(),
      effectiveType: TEMPLATE_VARIABLE_TYPE_BY_HINT[typeHint ?? ''] ?? TestCaseItemType.STRING,
      hasDefault,
      defaultValue: hasDefault ? defaultValue.trim() : undefined,
    });
  }
  return params;
};

const collectParamsFromValue = (value: unknown): ParsedTemplateParam[] => {
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
 * Extracts all template parameter names from a request template — the name only, with any `|type` hint
 * and `:default` stripped, so the result is directly comparable to an `InputBinding.templateVariable`.
 */
export const getTemplateParameters = (template: TestSuiteRequestTemplate | undefined): string[] => {
  if (!template) {
    return [];
  }
  const names = collectParamsFromValue(template).map((param) => param.name);
  return [...new Set(names)];
};

/**
 * Scans a request template's URL, headers, query params, and body (including a jsonataContent
 * expression) for placeholders, the same surface `getTemplateParameters` covers, and returns one
 * `TemplateVariable` per unique name in first-seen order — the shape `generateInputBindingsRowData`
 * expects. A `|type` hint sets `effectiveType`, which is what decides the editor `VariableRow` renders
 * (a file picker for `file`, a number input for `number`, …).
 */
export const getTemplateParameterVariables = (template: TestSuiteRequestTemplate | undefined): TemplateVariable[] => {
  if (!template) {
    return [];
  }

  const seen = new Set<string>();
  const variables: TemplateVariable[] = [];

  collectParamsFromValue(template).forEach(({ name, effectiveType, hasDefault, defaultValue }) => {
    if (seen.has(name)) {
      return;
    }
    seen.add(name);
    variables.push({
      name,
      hasDefault,
      defaultValue: hasDefault ? defaultValue : null,
      effectiveType,
      sources: [],
    });
  });

  return variables;
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
