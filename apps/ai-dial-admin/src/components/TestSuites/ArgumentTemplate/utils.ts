const BINDING_PATTERN = /^\$\{\{(.*)}}$/;

export function inferFieldMode(value: unknown): 'binding' | 'constant' {
  if (typeof value === 'string' && BINDING_PATTERN.test(value)) {
    return 'binding';
  }
  return 'constant';
}

export function extractBindingColumn(value: string): string {
  const match = value.match(BINDING_PATTERN);
  if (!match) return '';
  const inner = match[1];
  const colonIdx = inner.indexOf(':');
  return colonIdx >= 0 ? inner.slice(0, colonIdx) : inner;
}

export function buildInitialArguments(inputSchema?: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const properties = (inputSchema as { properties?: Record<string, unknown> })?.properties;
  if (!properties) return result;

  for (const key of Object.keys(properties)) {
    const prop = properties[key] as { type?: string };
    if (prop?.type === 'object') {
      result[key] = {};
    } else if (prop?.type === 'array') {
      result[key] = [];
    } else {
      result[key] = '';
    }
  }
  return result;
}

import { ArgumentRow } from '@/src/models/evaluation/test-suite';

export type { ArgumentRow };

export function buildArgumentsFromTable(rows: ArgumentRow[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.name] = row.value;
  }
  return result;
}
