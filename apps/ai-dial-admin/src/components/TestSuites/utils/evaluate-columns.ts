import jsonata from 'jsonata';

import { ResponseColumn } from '@/src/models/evaluation/test-suite';

export interface EvaluatedColumn {
  name: string;
  expression: string;
  type: string;
  result: string;
  valid: boolean;
}

export const evaluateColumns = async (
  columns: ResponseColumn[],
  response: Record<string, unknown>,
): Promise<EvaluatedColumn[]> => {
  return Promise.all(
    columns.map(async (column) => {
      let result: string = '';
      let valid = false;

      try {
        const expr = jsonata(column.expression);
        const evaluated = await expr.evaluate(response);
        valid = evaluated != null;
        if (!valid) {
          result = '';
        } else {
          result = typeof evaluated === 'object' ? JSON.stringify(evaluated) : String(evaluated);
        }
      } catch {
        result = '';
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
