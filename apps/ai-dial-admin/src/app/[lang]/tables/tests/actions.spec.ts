import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { AnalyticsTableType, CreateTableDto } from '@/src/models/analytics/table';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { addRows, createTable, deleteTable, getTable, getTables, updateTableSchema } from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Tables server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('getTables passes the token to the client', async () => {
    (analyticsDataApi.getTables as any).mockResolvedValue([]);

    await getTables();

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsDataApi.getTables).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('getTable passes name + token', async () => {
    (analyticsDataApi.getTable as any).mockResolvedValue(null);

    await getTable('events');

    expect(analyticsDataApi.getTable).toHaveBeenCalledWith('events', TOKEN_MOCK);
  });

  test('createTable passes the dto + token', async () => {
    const dto: CreateTableDto = { name: 'events', type: AnalyticsTableType.Source, columns: [] };
    (analyticsDataApi.createTable as any).mockResolvedValue({ success: true });

    await createTable(dto);

    expect(analyticsDataApi.createTable).toHaveBeenCalledWith(dto, TOKEN_MOCK);
  });

  test('deleteTable passes name + token', async () => {
    (analyticsDataApi.deleteTable as any).mockResolvedValue({ success: true });

    await deleteTable('events');

    expect(analyticsDataApi.deleteTable).toHaveBeenCalledWith('events', TOKEN_MOCK);
  });

  test('updateTableSchema passes name, patch + token', async () => {
    const patch = { drop: ['old_col'] };
    (analyticsDataApi.updateTableSchema as any).mockResolvedValue({ success: true });

    await updateTableSchema('events', patch);

    expect(analyticsDataApi.updateTableSchema).toHaveBeenCalledWith('events', patch, TOKEN_MOCK);
  });

  test('addRows passes name, dto + token', async () => {
    const dto = { rows: [{ id: '1' }] };
    (analyticsDataApi.addRows as any).mockResolvedValue({ success: true });

    await addRows('events', dto);

    expect(analyticsDataApi.addRows).toHaveBeenCalledWith('events', dto, TOKEN_MOCK);
  });
});
