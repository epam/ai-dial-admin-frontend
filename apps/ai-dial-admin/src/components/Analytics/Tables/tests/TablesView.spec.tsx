import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TablesView from '@/src/components/Analytics/Tables/TablesView';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>catalog rows: {rowData?.length ?? 0}</div>,
}));

const TABLES: AnalyticsTable[] = [
  { name: 'dial_usage_log', type: AnalyticsTableType.Source },
  { name: 'rate_analytics', type: AnalyticsTableType.Source },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TablesView', () => {
  test('renders the server-provided catalog and the create buttons', () => {
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText('catalog rows: 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.CreateSource })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.CreateEnrichment })).toBeInTheDocument();
  });

  test('renders an empty catalog', () => {
    render(<TablesView initialTables={[]} />);

    expect(screen.getByText('catalog rows: 0')).toBeInTheDocument();
  });
});
