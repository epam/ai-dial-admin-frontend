import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, rolesApi } from '@/src/app/api/api';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTableType, CreateTableDto } from '@/src/models/analytics/table';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ConfigEntityOrigin, ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  addRows,
  createTable,
  defineTableSchema,
  deleteTable,
  getRoles,
  getTable,
  getTableAccess,
  getTables,
  replaceTableAccess,
  updateTable,
  updateTableSchema,
} from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/config-entities/read-page-options');

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

  test('createTable passes the identity-only dto + token', async () => {
    const dto: CreateTableDto = { name: 'events', type: AnalyticsTableType.Source };
    (analyticsDataApi.createTable as any).mockResolvedValue({ success: true });

    await createTable(dto);

    expect(analyticsDataApi.createTable).toHaveBeenCalledWith(dto, TOKEN_MOCK);
  });

  test('updateTable passes name, dto + token', async () => {
    const dto = { description: 'Updated', tag_order: ['pii'] };
    (analyticsDataApi.updateTable as any).mockResolvedValue({ success: true });

    await updateTable('events', dto);

    expect(analyticsDataApi.updateTable).toHaveBeenCalledWith('events', dto, TOKEN_MOCK);
  });

  test('deleteTable passes name + token', async () => {
    (analyticsDataApi.deleteTable as any).mockResolvedValue({ success: true });

    await deleteTable('events');

    expect(analyticsDataApi.deleteTable).toHaveBeenCalledWith('events', TOKEN_MOCK);
  });

  test('defineTableSchema passes name, schema dto + token', async () => {
    const schema = { columns: [], ordering_key: ['ts'] };
    (analyticsDataApi.defineTableSchema as any).mockResolvedValue({ success: true });

    await defineTableSchema('events', schema);

    expect(analyticsDataApi.defineTableSchema).toHaveBeenCalledWith('events', schema, TOKEN_MOCK);
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

  test('getTableAccess passes name + token', async () => {
    (analyticsDataApi.getTableAccess as any).mockResolvedValue({ write: [], modify: [] });

    await getTableAccess('events');

    expect(analyticsDataApi.getTableAccess).toHaveBeenCalledWith('events', TOKEN_MOCK);
  });

  test('replaceTableAccess passes name, access + token', async () => {
    const access = { write: ['w'], modify: ['m'] };
    (analyticsDataApi.replaceTableAccess as any).mockResolvedValue({ success: true });

    await replaceTableAccess('events', access);

    expect(analyticsDataApi.replaceTableAccess).toHaveBeenCalledWith('events', access, TOKEN_MOCK);
  });

  test('getRoles reads the role catalog from Core, not from the admin backend', async () => {
    (readConfigEntities as any).mockResolvedValue([
      { name: 'analytics-writer', displayName: 'analytics-writer', origin: ConfigEntityOrigin.Api },
    ]);

    const catalog = await getRoles();

    expect(readConfigEntities).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Roles, []);
    expect(rolesApi.getRolesList).not.toHaveBeenCalled();
    expect(catalog.roles).toEqual([
      { name: 'analytics-writer', displayName: 'analytics-writer', origin: ConfigEntityOrigin.Api },
    ]);
  });

  test('getRoles returns the warnings the Core read reported', async () => {
    (readConfigEntities as any).mockImplementation(
      async (_token: unknown, _type: unknown, warnings: EntitiesI18nKey[]) => {
        warnings.push(EntitiesI18nKey.OptionListPartial);
        return [];
      },
    );

    const catalog = await getRoles();

    expect(catalog).toEqual({ roles: [], warnings: [EntitiesI18nKey.OptionListPartial] });
  });
});
