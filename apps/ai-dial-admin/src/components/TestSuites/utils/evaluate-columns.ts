import jsonata from 'jsonata';

import { ResponseColumn } from '@/src/models/evaluation/test-suite';

export interface EvaluatedColumn {
  name: string;
  expression: string;
  type: string;
  result: string | null;
  valid: boolean;
}

export const evaluateColumns = async (
  columns: ResponseColumn[],
  response: Record<string, unknown>,
): Promise<EvaluatedColumn[]> => {
  return Promise.all(
    columns.map(async (column) => {
      let result: string | null = null;
      let valid = false;

      try {
        const expr = jsonata(column.expression);
        const evaluated = await expr.evaluate(response);
        valid = evaluated != null;
        if (!valid) {
          result = null;
        } else {
          result = typeof evaluated === 'object' ? JSON.stringify(evaluated) : evaluated;
        }
      } catch {
        result = null;
        valid = false;
      }

      return {
        name: column.name,
        expression: column.expression,
        type: column.type,
        result,
        valid,
      };
    }),
  );
};
