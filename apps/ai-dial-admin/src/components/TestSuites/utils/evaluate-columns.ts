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
        result = await expr.evaluate(response);
        valid = result !== undefined && result !== null;
        if (!valid) {
          result = null;
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
