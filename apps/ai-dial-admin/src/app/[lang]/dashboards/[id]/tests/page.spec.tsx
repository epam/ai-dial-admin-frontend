import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/dashboards/[id]/page';
import { getResolvedDashboard, listDashboards } from '@/src/app/[lang]/dashboards/custom-actions';
import CustomDashboardView from '@/src/components/Analytics/CustomDashboards/CustomDashboardView';
import Page403 from '@/src/components/Page403/Page403';
import { DashboardVisibility, ResolvedDashboard } from '@/src/models/analytics/dashboard';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { getIsCustomDashboardsEnabled } from '@/src/utils/env/get-custom-dashboards-toggle';

vi.mock('@/src/components/Analytics/CustomDashboards/CustomDashboardView', () => ({ default: vi.fn() }));
vi.mock('@/src/components/Page403/Page403', () => ({ default: vi.fn() }));
vi.mock('@/src/app/[lang]/dashboards/custom-actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/utils/env/get-custom-dashboards-toggle');

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({ notFound: () => notFound() }));

const resolved: ResolvedDashboard = {
  dashboard: {
    id: 'd1',
    name: 'Ops',
    visibility: DashboardVisibility.Private,
    widgets: [],
    generation: 1,
    created_at: '',
    updated_at: '',
    permissions: { write: true, publish: true },
  },
  queries: {},
};

type Element = { type: unknown; props: { children: { type: unknown; props: Record<string, unknown> } } };

const renderPage = async (searchParams: Record<string, string> = {}) =>
  (await Page({ params: Promise.resolve({ id: 'd1' }), searchParams: Promise.resolve(searchParams) })) as Element;

describe('custom dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIsCustomDashboardsEnabled).mockReturnValue(true);
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
    vi.mocked(getResolvedDashboard).mockResolvedValue({ success: true, response: resolved });
    vi.mocked(listDashboards).mockResolvedValue({
      success: true,
      response: { dashboards: [], permissions: { create_private: true, create_public: false } },
    });
  });

  test('answers not found while custom dashboards are off', async () => {
    vi.mocked(getIsCustomDashboardsEnabled).mockReturnValue(false);

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getResolvedDashboard).not.toHaveBeenCalled();
  });

  test('renders the forbidden page for a user without analytics access', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    expect((await renderPage()).type).toBe(Page403);
  });

  test('answers not found for a dashboard that does not exist', async () => {
    vi.mocked(getResolvedDashboard).mockResolvedValue({ success: false, status: 404 });

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  test('renders the dashboard in view mode by default', async () => {
    const view = (await renderPage()).props.children;

    expect(view.type).toBe(CustomDashboardView);
    expect(view.props).toMatchObject({
      resolved,
      dashboards: [],
      createPermissions: { create_private: true, create_public: false },
      isInitiallyEditing: false,
    });
  });

  test('opens a just-created dashboard in edit mode', async () => {
    expect((await renderPage({ edit: '1' })).props.children.props.isInitiallyEditing).toBe(true);
  });
});
