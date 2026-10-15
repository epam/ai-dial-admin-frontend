import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getDatasetTestSuitesPage } from '@/src/app/[lang]/datasets/actions';
import { DatasetVisibility } from '@/src/models/evaluation/dataset';
import { getIsSchemaReadOnly } from '../schema-lock';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({ getDatasetTestSuitesPage: vi.fn() }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

const publicDataset = { id: 'ds-1', visibility: DatasetVisibility.PUBLIC };

describe('getIsSchemaReadOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('probes a single row for a PUBLIC dataset', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockResolvedValue({
      page: 0,
      size: 1,
      totalElements: 1,
      totalPages: 1,
      content: [{}],
    });

    await getIsSchemaReadOnly(publicDataset);

    expect(getDatasetTestSuitesPage).toHaveBeenCalledOnce();
    expect(getDatasetTestSuitesPage).toHaveBeenCalledWith('ds-1', 0, 1, [], []);
  });

  test('is read-only when a test suite is bound, even exactly one', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockResolvedValue({
      page: 0,
      size: 1,
      totalElements: 1,
      totalPages: 1,
      content: [{}],
    });

    expect(await getIsSchemaReadOnly(publicDataset)).toBe(true);
  });

  test('is editable when no test suite is bound', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockResolvedValue({
      page: 0,
      size: 1,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });

    expect(await getIsSchemaReadOnly(publicDataset)).toBe(false);
  });

  test('is editable when the lookup returns nothing', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockResolvedValue(null);

    expect(await getIsSchemaReadOnly(publicDataset)).toBe(false);
  });

  test('fails open when the lookup throws', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockRejectedValue(new Error('down'));

    expect(await getIsSchemaReadOnly(publicDataset)).toBe(false);
  });

  test('skips the lookup for a PRIVATE dataset', async () => {
    expect(await getIsSchemaReadOnly({ id: 'DATASET_1', visibility: DatasetVisibility.PRIVATE })).toBe(false);
    expect(getDatasetTestSuitesPage).not.toHaveBeenCalled();
  });
});
