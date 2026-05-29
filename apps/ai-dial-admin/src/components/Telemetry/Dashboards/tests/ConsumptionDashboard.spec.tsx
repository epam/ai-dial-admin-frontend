import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConsumptionDashboard from '../ConsumptionDashboard';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';

type GetDataFn = (query: TelemetryQuery) => Promise<ServerActionResponse>;

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialLoader: () => <div data-testid="loader" />,
  };
});

vi.mock('@/src/components/Common/TreeGrid/TreeGrid', () => ({
  default: ({ rows }: { rows: { name: string; children?: unknown[] }[] }) => (
    <div data-testid="tree-grid" data-row-count={rows.length} />
  ),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData: Record<string, string>[] | null }) => (
    <div data-testid="projects-grid" data-row-count={rowData?.length ?? 0} />
  ),
}));

const HEADERS = [
  'deployment',
  'parent_deployment',
  'execution_path',
  'project_id',
  'count',
  'money',
  'aggregated_money',
  'tokens_p',
  'tokens_c',
];

const row = (overrides: Partial<Record<string, string>>): string[] => {
  const r: Record<string, string> = {
    deployment: 'd_1',
    parent_deployment: '',
    execution_path: 'd_1',
    project_id: 'p_1',
    count: '1',
    money: '0',
    aggregated_money: '0',
    tokens_p: '0',
    tokens_c: '0',
    ...overrides,
  };
  return HEADERS.map((h) => r[h]);
};

const makeResponse = (data: string[][]): ServerActionResponse => ({
  success: true,
  response: { headers: HEADERS, data },
});

describe('ConsumptionDashboard', () => {
  let getData: ReturnType<typeof vi.fn<GetDataFn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeResponse([row({})]));
  });

  test('fires the extended consumption query (groupBy includes project_id)', async () => {
    render(<ConsumptionDashboard route={ApplicationRoute.Dashboard} getData={getData} />);

    await waitFor(() => {
      expect(getData).toHaveBeenCalledTimes(1);
    });
    expect(getData).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          groupBy: expect.arrayContaining(['deployment', 'parent_deployment', 'execution_path', 'project_id']),
        }),
      }),
    );
  });

  test('multi-project response fans out to both children with correct row counts', async () => {
    getData = vi
      .fn<GetDataFn>()
      .mockResolvedValue(
        makeResponse([
          row({ deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_1', tokens_p: '0' }),
          row({ deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_2', tokens_p: '100' }),
          row({ deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_3', tokens_p: '200' }),
        ]),
      );

    render(<ConsumptionDashboard route={ApplicationRoute.Dashboard} getData={getData} />);

    await waitFor(() => {
      const tree = screen.getByTestId('tree-grid');
      // 1 deployment triplet across 3 projects → 1 tree root
      expect(Number(tree.getAttribute('data-row-count'))).toBe(1);

      const projects = screen.getByTestId('projects-grid');
      // 3 distinct project roots → 3 project rows
      expect(Number(projects.getAttribute('data-row-count'))).toBe(3);
    });
  });

  test('failed response leaves both children in the no-data state', async () => {
    getData = vi.fn<GetDataFn>().mockResolvedValue({ success: false });
    render(<ConsumptionDashboard route={ApplicationRoute.Dashboard} getData={getData} />);

    await waitFor(() => {
      expect(screen.queryByTestId('tree-grid')).not.toBeInTheDocument();
    });
    // Projects grid renders with empty data → row count 0 (not a missing element)
    expect(Number(screen.getByTestId('projects-grid').getAttribute('data-row-count'))).toBe(0);
  });

  test('non-Dashboard route hides the tree but still renders the projects grid', async () => {
    render(<ConsumptionDashboard route={ApplicationRoute.Applications} getData={getData} />);

    await waitFor(() => {
      expect(screen.getByTestId('projects-grid')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('tree-grid')).not.toBeInTheDocument();
  });

  test('rejected getData clears loading and renders empty state (no stuck spinner)', async () => {
    getData = vi.fn<GetDataFn>().mockRejectedValue(new Error('boom'));
    render(<ConsumptionDashboard route={ApplicationRoute.Dashboard} getData={getData} />);

    await waitFor(() => {
      expect(screen.queryByTestId('tree-grid')).not.toBeInTheDocument();
    });
    expect(Number(screen.getByTestId('projects-grid').getAttribute('data-row-count'))).toBe(0);
  });

  test('refetches when the getData reference changes (time period / filter change)', async () => {
    const { rerender } = render(<ConsumptionDashboard route={ApplicationRoute.Dashboard} getData={getData} />);
    await waitFor(() => expect(getData).toHaveBeenCalledTimes(1));

    const replacement = vi.fn<GetDataFn>().mockResolvedValue(makeResponse([row({})]));
    rerender(<ConsumptionDashboard route={ApplicationRoute.Dashboard} getData={replacement} />);

    await waitFor(() => expect(replacement).toHaveBeenCalledTimes(1));
    expect(getData).toHaveBeenCalledTimes(1);
  });
});
