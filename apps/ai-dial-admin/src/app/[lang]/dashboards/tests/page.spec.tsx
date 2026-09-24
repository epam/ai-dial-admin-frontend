import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DashboardRedirect from '@/src/app/[lang]/dashboard/page';
import Page from '@/src/app/[lang]/dashboards/page';
import UsageRedirect from '@/src/app/[lang]/usage/page';
import UsageDashboard from '@/src/components/Analytics/Usage/UsageDashboard';
import Page403 from '@/src/components/Page403/Page403';
import DashboardView from '@/src/components/Telemetry/DashboardView';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/components/Analytics/Usage/UsageDashboard', () => ({ default: vi.fn() }));
vi.mock('@/src/components/Page403/Page403', () => ({ default: vi.fn() }));
vi.mock('@/src/components/Telemetry/DashboardView', () => ({ default: vi.fn() }));
vi.mock('@/src/server/analytics/analytics-access');

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
const redirect = vi.fn();
vi.mock('next/navigation', () => ({ notFound: () => notFound(), redirect: (path: string) => redirect(path) }));

const forbidden = () => isAnalyticsForbidden as unknown as ReturnType<typeof vi.fn>;

const renderPage = async () => (await Page()) as { type: unknown; props: Record<string, unknown> };

const ENV_KEYS = [
  'ANALYTICS_ENABLED',
  'ANALYTICS_USAGE_ENABLED',
  'DIAL_ADMIN_API_URL',
  'GRAFANA_LINK',
  'DISABLE_MENU_ITEMS',
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  forbidden().mockResolvedValue(false);
});

afterEach(() => {
  ENV_KEYS.forEach((key) => delete process.env[key]);
});

const enableAnalytics = () => {
  process.env.ANALYTICS_ENABLED = 'true';
  process.env.ANALYTICS_USAGE_ENABLED = 'true';
};

describe('dashboards page', () => {
  test('renders the analytics page when both analytics flags are on', async () => {
    enableAnalytics();
    process.env.DIAL_ADMIN_API_URL = 'http://admin';

    expect((await renderPage()).type).toBe(UsageDashboard);
  });

  test('renders the forbidden page behind the analytics branch', async () => {
    enableAnalytics();
    forbidden().mockResolvedValue(true);

    expect((await renderPage()).type).toBe(Page403);
  });

  test('falls back to the telemetry dashboard when the usage flag is off', async () => {
    process.env.ANALYTICS_ENABLED = 'true';
    process.env.DIAL_ADMIN_API_URL = 'http://admin';
    process.env.GRAFANA_LINK = 'http://grafana';

    const page = await renderPage();

    expect(page.type).toBe(DashboardView);
    expect(page.props).toEqual({ grafanaLink: 'http://grafana' });
    expect(forbidden()).not.toHaveBeenCalled();
  });

  test('falls back to the telemetry dashboard when the analytics flag is off', async () => {
    process.env.ANALYTICS_USAGE_ENABLED = 'true';
    process.env.DIAL_ADMIN_API_URL = 'http://admin';

    expect((await renderPage()).type).toBe(DashboardView);
  });

  test('answers as not found when the telemetry dashboard is disabled', async () => {
    process.env.DIAL_ADMIN_API_URL = 'http://admin';
    process.env.DISABLE_MENU_ITEMS = 'catalog dashboard';

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  test('still renders the analytics page when the telemetry dashboard is disabled', async () => {
    enableAnalytics();
    process.env.DISABLE_MENU_ITEMS = 'dashboard';

    expect((await renderPage()).type).toBe(UsageDashboard);
  });

  test('answers as not found when neither page can render', async () => {
    process.env.ANALYTICS_USAGE_ENABLED = 'true';

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('old dashboard paths', () => {
  test('/dashboard redirects to /dashboards', () => {
    DashboardRedirect();

    expect(redirect).toHaveBeenCalledWith(ApplicationRoute.Dashboard);
    expect(ApplicationRoute.Dashboard).toBe('/dashboards');
  });

  test('/usage redirects to /dashboards', () => {
    UsageRedirect();

    expect(redirect).toHaveBeenCalledWith('/dashboards');
  });
});
