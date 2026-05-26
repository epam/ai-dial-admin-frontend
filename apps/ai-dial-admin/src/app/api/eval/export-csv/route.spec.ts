import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

import { POST } from './route';

vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/eval/export-csv', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/eval/export-csv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  it('returns 500 when analyticsApi.exportCsv returns null', async () => {
    (analyticsApi.exportCsv as any).mockResolvedValue(null);

    const res = await POST(makeRequest({ runId: 'run-1', computation: 'latest', columns: ['id'], delimiter: ',' }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Export failed' });
  });

  it('returns 200 with CSV content and correct headers on success', async () => {
    const csvContent = 'id,prompt\nrun-1,hello';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    (analyticsApi.exportCsv as any).mockResolvedValue({ blob, fileName: 'export.csv' });

    const res = await POST(
      makeRequest({ runId: 'run-1', computation: 'latest', columns: ['id', 'prompt'], delimiter: ',' }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv; charset=UTF-8');
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="export.csv"');
    expect(await res.text()).toBe(csvContent);
  });

  it('calls analyticsApi.exportCsv with parsed DTO and user token', async () => {
    const csvContent = 'id\nrun-1';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    (analyticsApi.exportCsv as any).mockResolvedValue({ blob, fileName: 'export.csv' });

    const dto = { runId: 'run-1', computation: 'latest', columns: ['id'], delimiter: ',' };
    await POST(makeRequest(dto));

    expect(analyticsApi.exportCsv).toHaveBeenCalledWith(dto, TOKEN_MOCK);
  });
});
