import { describe, expect, test } from 'vitest';

import { getInterceptorsGridData } from '@/src/components/EntityView/Interceptors/utils';
import { ConfigEntityOption } from '@/src/models/dial/config-file';
import { ConfigEntityOrigin, ConfigFileEntityType } from '@/src/types/config-file-entity';
import { toConfigEntityRows } from '@/src/utils/config-entities/rows';

const OPTIONS: ConfigEntityOption[] = [
  { name: 'from-file', origin: ConfigEntityOrigin.ConfigFile },
  { name: 'from-api', origin: ConfigEntityOrigin.Api },
];

const rows = () => toConfigEntityRows(OPTIONS, ConfigFileEntityType.Interceptors);

describe('toConfigEntityRows', () => {
  test('carries the bare name in both name and displayName for a short-name-keyed type, plus the origin', () => {
    expect(rows()).toEqual([
      { name: 'from-file', displayName: 'from-file', origin: ConfigEntityOrigin.ConfigFile },
      { name: 'from-api', displayName: 'from-api', origin: ConfigEntityOrigin.Api },
    ]);
  });

  // Without displayName the grid's Display Name column renders blank, since it reads that field and
  // falls back only to the same field's value.
  test('always sets displayName so the name column cannot render blank', () => {
    expect(rows().every((row) => !!row.displayName)).toBe(true);
  });
});

describe('selection round-trip through the shared interceptor picker', () => {
  // The picker matches a stored selection with `entity.name === selected`. Core keys interceptors by
  // bare short name from both populations, so a stored selection is the bare name regardless of origin.
  test('matches a stored bare-name selection from either origin', () => {
    const selected = getInterceptorsGridData(rows(), ['from-api', 'from-file']);

    expect(selected.map((row) => row.displayName)).toEqual(['from-api', 'from-file']);
  });

  test('preserves selection order rather than option order', () => {
    const selected = getInterceptorsGridData(rows(), ['from-api', 'from-file']);

    expect(selected.map((row) => row.displayName)).toEqual(['from-api', 'from-file']);
  });
});
