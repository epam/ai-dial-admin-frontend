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
  test('carries the reference in name, the bare name in displayName, and the origin', () => {
    expect(rows()).toEqual([
      { name: 'from-file', displayName: 'from-file', origin: ConfigEntityOrigin.ConfigFile },
      { name: 'interceptors/platform/from-api', displayName: 'from-api', origin: ConfigEntityOrigin.Api },
    ]);
  });

  // Without displayName the grid's Display Name column renders blank, since it reads that field and
  // falls back only to the same field's value.
  test('always sets displayName so the name column cannot render blank', () => {
    expect(rows().every((row) => !!row.displayName)).toBe(true);
  });
});

describe('selection round-trip through the shared interceptor picker', () => {
  // The picker matches a stored selection with `entity.name === selected`, and Core stores an
  // API-written entity's canonical id. A row keyed by the bare name would leave such a selection
  // permanently unmatched — invisible in the tab while still present on the resource.
  test('matches a stored canonical-id selection', () => {
    const selected = getInterceptorsGridData(rows(), ['interceptors/platform/from-api']);

    expect(selected).toHaveLength(1);
    expect(selected[0].displayName).toBe('from-api');
  });

  test('matches a bare-name selection saved before the change', () => {
    const selected = getInterceptorsGridData(rows(), ['from-file']);

    expect(selected).toHaveLength(1);
    expect(selected[0].name).toBe('from-file');
  });

  test('preserves selection order rather than option order', () => {
    const selected = getInterceptorsGridData(rows(), ['interceptors/platform/from-api', 'from-file']);

    expect(selected.map((row) => row.displayName)).toEqual(['from-api', 'from-file']);
  });

  test('does not match an API-written entity by its bare name', () => {
    expect(getInterceptorsGridData(rows(), ['from-api'])).toEqual([]);
  });
});
