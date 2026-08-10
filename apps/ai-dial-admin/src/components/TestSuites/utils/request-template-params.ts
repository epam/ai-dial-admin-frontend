import { InputBinding, TemplateVariable, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

/** Matches ${{name}} or ${{name:defaultValue}} in template strings */
const TEMPLATE_PARAM_REGEX = /\$\{\{([^}:]+)(?::([^}]*))?\}\}/g;

interface ParsedTemplateParam {
  name: string;
  hasDefault: boolean;
  defaultValue?: string;
}

const collectParamsFromString = (str: string): ParsedTemplateParam[] => {
  const params: ParsedTemplateParam[] = [];
  let match: RegExpExecArray | null;
  TEMPLATE_PARAM_REGEX.lastIndex = 0;
  while ((match = TEMPLATE_PARAM_REGEX.exec(str)) !== null) {
    const hasDefault = match[2] !== undefined;
    params.push({
      name: match[1].trim(),
      hasDefault,
      defaultValue: hasDefault ? match[2].trim() : undefined,
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
 * Extracts all template parameter names from a request template.
 * Parameters match the pattern ${{name}} or ${{name:defaultValue}}.
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
 * expression) for ${{name}} / ${{name:defaultValue}} placeholders, the same surface
 * `getTemplateParameters` covers, and returns one `TemplateVariable` per unique name in
 * first-seen order — the shape `generateInputBindingsRowData` expects in place of the
 * server-fetched variables used for request #0.
 */
export const getTemplateParameterVariables = (template: TestSuiteRequestTemplate | undefined): TemplateVariable[] => {
  if (!template) {
    return [];
  }

  const seen = new Set<string>();
  const variables: TemplateVariable[] = [];

  collectParamsFromValue(template).forEach(({ name, hasDefault, defaultValue }) => {
    if (seen.has(name)) {
      return;
    }
    seen.add(name);
    variables.push({
      name,
      hasDefault,
      defaultValue: hasDefault ? defaultValue : null,
      effectiveType: TestCaseItemType.STRING,
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
