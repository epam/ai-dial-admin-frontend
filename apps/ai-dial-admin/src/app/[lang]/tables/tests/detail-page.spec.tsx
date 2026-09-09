import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable } from '@/src/app/[lang]/tables/actions';
import Page from '@/src/app/[lang]/tables/[id]/page';
import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({ notFound: () => notFound() }));

const table: AnalyticsTable = {
  name: 'conversation_ratings',
  type: AnalyticsTableType.Source,
  status: TableStatus.Active,
};

type RenderedElement = { type: unknown; props: Record<string, unknown> };

const renderPage = async (id = 'conversation_ratings') =>
  (await Page({ params: Promise.resolve({ id }) })) as RenderedElement;

// The page now wraps the view in SaveValidationContextProvider, so the view under assertion is one
// level in.
const renderView = async (id?: string): Promise<RenderedElement> =>
  (await renderPage(id)).props.children as RenderedElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTable).mockResolvedValue(table);
  delete process.env.ANALYTICS_PUBLIC_URL;
  delete process.env.ANALYTICS_FLIGHT_SQL_PUBLIC_URL;
});

describe('table detail page', () => {
  test('wraps the view in the save-validation provider', async () => {
    const page = await renderPage();
    const view = page.props.children as RenderedElement;

    expect(page.type).toBe(SaveValidationContextProvider);
    expect(view.type).toBe(TableDetailView);
  });

  test('hands the view the fetched table, decoded name, and configured base URLs', async () => {
    process.env.ANALYTICS_PUBLIC_URL = 'https://analytics.example.com';
    process.env.ANALYTICS_FLIGHT_SQL_PUBLIC_URL = 'grpc://flight.example.com';

    const view = await renderView('conversation_ratings');

    expect(getTable).toHaveBeenCalledWith('conversation_ratings');
    expect(view.props.name).toBe('conversation_ratings');
    expect(view.props.initialTable).toEqual(table);
    expect(view.props.apiBaseUrl).toBe('https://analytics.example.com');
    expect(view.props.flightUri).toBe('grpc://flight.example.com');
  });

  test('decodes a percent-encoded id before looking up the table', async () => {
    await renderView('usage%2Fclient%20identity');

    expect(getTable).toHaveBeenCalledWith('usage/client identity');
  });

  test('falls back to an empty base URL when the env vars are unset', async () => {
    const view = await renderView();

    expect(view.props.apiBaseUrl).toBe('');
    expect(view.props.flightUri).toBe('');
  });

  test('is not found when the table read resolves to nothing', async () => {
    vi.mocked(getTable).mockResolvedValue(null);

    await expect(renderPage('missing-table')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  test('is not found when the table read throws', async () => {
    vi.mocked(getTable).mockRejectedValue(new Error('boom'));

    await expect(renderPage('conversation_ratings')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
