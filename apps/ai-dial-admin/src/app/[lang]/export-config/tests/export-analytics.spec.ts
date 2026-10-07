import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';
import { AnalyticsExportEntityType, CatalogComponentType } from '@/src/types/analytics/export';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { exportAnalyticsConfig, getAnalyticsEntities, previewAnalyticsExportConfig } from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('@/src/app/api/api');

const REQUEST = { components: [{ type: CatalogComponentType.PIPELINE, name: 'usage_enrich' }] };
const FAILURE = { success: false, status: 403, errorHeader: 'Forbidden', errorMessage: 'No access', requestId: 'r-1' };

describe('Export config actions :: Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
  });

  test('exportAnalyticsConfig passes the request and token through', async () => {
    const response = { success: true, response: { blob: new Blob(), fileName: 'adas-catalog.json' } };
    vi.mocked(analyticsDataApi.exportCatalog).mockResolvedValue(response);

    const result = await exportAnalyticsConfig(REQUEST);

    expect(analyticsDataApi.exportCatalog).toHaveBeenCalledWith(REQUEST, TOKEN_MOCK);
    expect(result).toBe(response);
  });

  test('previewAnalyticsExportConfig passes the request and token through', async () => {
    const response = { success: true, response: { objects: [], required_system_tables: [], skipped: [] } };
    vi.mocked(analyticsDataApi.previewCatalogExport).mockResolvedValue(response);

    const result = await previewAnalyticsExportConfig(REQUEST);

    expect(analyticsDataApi.previewCatalogExport).toHaveBeenCalledWith(REQUEST, TOKEN_MOCK);
    expect(result).toBe(response);
  });

  test('getAnalyticsEntities offers only active user tables', async () => {
    vi.mocked(analyticsDataApi.getTables).mockResolvedValue({
      success: true,
      response: [
        {
          name: 'usage_sentiment',
          description: 'Sentiment',
          status: TableStatus.Active,
          type: AnalyticsTableType.Enrichment,
        },
        { name: 'usage_draft', status: TableStatus.Pending, type: AnalyticsTableType.Source },
        { name: 'usage_log', status: TableStatus.Active, system: true, type: AnalyticsTableType.Source },
      ],
    });

    const result = await getAnalyticsEntities(AnalyticsExportEntityType.TABLE);

    expect(result.success).toBe(true);
    expect(result.response).toEqual([
      {
        name: 'usage_sentiment',
        displayName: 'usage_sentiment',
        description: 'Sentiment',
        type: AnalyticsExportEntityType.TABLE,
      },
    ]);
  });

  test('getAnalyticsEntities lists every pipeline unfiltered', async () => {
    vi.mocked(analyticsDataApi.getPipelines).mockResolvedValue({
      success: true,
      response: [{ name: 'usage_enrich' } as Pipeline],
    });

    const result = await getAnalyticsEntities(AnalyticsExportEntityType.PIPELINE);

    expect(analyticsDataApi.getPipelines).toHaveBeenCalledWith(undefined, TOKEN_MOCK);
    expect(result.response).toEqual([
      {
        name: 'usage_enrich',
        displayName: 'usage_enrich',
        description: undefined,
        type: AnalyticsExportEntityType.PIPELINE,
      },
    ]);
  });

  test('getAnalyticsEntities returns the service failure without candidates', async () => {
    vi.mocked(analyticsDataApi.getTables).mockResolvedValue(FAILURE);

    const result = await getAnalyticsEntities(AnalyticsExportEntityType.TABLE);

    expect(result).toEqual(expect.objectContaining({ success: false, errorMessage: 'No access', requestId: 'r-1' }));
    expect(result.response).toBeUndefined();
  });
});
