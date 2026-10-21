import { describe, expect, test } from 'vitest';

import { toVarRows, toVars } from '@/src/components/Analytics/Pipelines/Enrich/vars';
import { VarBindingKind } from '@/src/models/analytics/pipeline-ui';

describe('Analytics :: pipelines :: toVarRows', () => {
  test('reads a column binding as the column selection', () => {
    const [row] = toVarRows({ request: { column: 'request_body' } });

    expect(row.name).toBe('request');
    expect(row.kind).toBe(VarBindingKind.Column);
    expect(row.column).toBe('request_body');
  });

  test('reads a jsonata binding as the transform selection', () => {
    const [row] = toVarRows({ members: { jsonata: '$join(members)' } });

    expect(row.kind).toBe(VarBindingKind.Jsonata);
    expect(row.jsonata).toBe('$join(members)');
  });

  test('reads an absent map as no rows', () => {
    expect(toVarRows()).toEqual([]);
  });
});

describe('Analytics :: pipelines :: toVars', () => {
  test('keys the map by variable name, carrying only the selected member', () => {
    const rows = [
      { id: '1', name: 'request', kind: VarBindingKind.Column, column: 'request_body', jsonata: '' },
      { id: '2', name: 'members', kind: VarBindingKind.Jsonata, column: '', jsonata: '$join(members)' },
    ];

    expect(toVars(rows)).toEqual({
      request: { column: 'request_body' },
      members: { jsonata: '$join(members)' },
    });
  });

  test('leaves out what the unselected member holds, rather than erasing it', () => {
    const rows = [{ id: '1', name: 'request', kind: VarBindingKind.Column, column: 'request_body', jsonata: 'body' }];

    expect(toVars(rows)).toEqual({ request: { column: 'request_body' } });
    expect(rows[0].jsonata).toBe('body');
  });

  test('drops a row still being filled in rather than sending it', () => {
    const rows = [
      { id: '1', name: '', kind: VarBindingKind.Column, column: 'request_body', jsonata: '' },
      { id: '2', name: 'request', kind: VarBindingKind.Column, column: '', jsonata: '' },
      { id: '3', name: 'members', kind: VarBindingKind.Jsonata, column: 'members', jsonata: '' },
    ];

    expect(toVars(rows)).toEqual({});
  });
});
