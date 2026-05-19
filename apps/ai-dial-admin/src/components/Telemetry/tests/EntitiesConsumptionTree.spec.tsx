import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EntitiesConsumptionTree from '../EntitiesConsumptionTree';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';

type GetDataFn = (query: TelemetryQuery) => Promise<ServerActionResponse>;

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialLoader: () => <div data-testid="loader" />,
  };
});

vi.mock('@/src/components/Common/TreeGrid/TreeGrid', () => ({
  default: ({ rows, columnDefs }: { rows: { name: string; children?: unknown[] }[]; columnDefs: unknown[] }) => {
    const summary = rows.map((r) => `${r.name}(${r.children?.length ?? 0})`).join(',');
    return (
      <div
        data-testid="tree-grid"
        data-row-count={rows.length}
        data-col-count={columnDefs.length}
        data-summary={summary}
      />
    );
  },
}));

// TelemetryData shape: { headers: string[], data: string[][] }
const makeTelemetryResponse = (backendRows: Record<string, string>[]) => {
  if (backendRows.length === 0) {
    return { success: true, response: { headers: [], data: [] } };
  }
  const headers = Object.keys(backendRows[0]);
  const data = backendRows.map((r) => Object.values(r));
  return { success: true, response: { headers, data } };
};

// Backend column names (before TELEMETRY_GRID_HEADERS_MAP remapping). Tree is built
// from execution_path now, so each row carries its full slash-separated chain.
const TREE_ROWS = [
  {
    deployment: 'gpt-4',
    parent_deployment: '',
    execution_path: 'gpt-4',
    count: '10',
    money: '5',
    aggregated_money: '6',
    tokens_p: '100',
    tokens_c: '200',
  },
  {
    deployment: 'child-model',
    parent_deployment: 'gpt-4',
    execution_path: 'gpt-4/child-model',
    count: '3',
    money: '1',
    aggregated_money: '2',
    tokens_p: '30',
    tokens_c: '60',
  },
];

describe('EntitiesConsumptionTree', () => {
  let getData: ReturnType<typeof vi.fn<GetDataFn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(TREE_ROWS));
  });

  test('fetches tree data on mount with ENTITY_CONSUMPTION_TREE_QUERY shape', async () => {
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      expect(getData).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            groupBy: expect.arrayContaining(['deployment', 'parent_deployment', 'execution_path']),
          }),
        }),
      );
    });
  });

  test('renders title in header', () => {
    render(<EntitiesConsumptionTree title="Entities Consumption" getData={getData} />);
    expect(screen.getByText('Entities Consumption')).toBeInTheDocument();
  });

  test('shows loader while fetching, then renders TreeGrid', async () => {
    let resolve: (v: ServerActionResponse) => void;
    getData = vi.fn<GetDataFn>().mockImplementation(
      () =>
        new Promise<ServerActionResponse>((r) => {
          resolve = r;
        }),
    );

    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    resolve!(makeTelemetryResponse(TREE_ROWS));

    await waitFor(() => {
      expect(screen.getByTestId('tree-grid')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  test('renders TreeGrid with rows from response', async () => {
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      expect(Number(grid.getAttribute('data-row-count'))).toBeGreaterThan(0);
    });
  });

  test('empty response shows no-data message instead of TreeGrid', async () => {
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse([]));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      expect(screen.queryByTestId('tree-grid')).not.toBeInTheDocument();
    });
  });

  test('failed response shows no-data message', async () => {
    getData = vi.fn<GetDataFn>().mockResolvedValue({ success: false });
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      expect(screen.queryByTestId('tree-grid')).not.toBeInTheDocument();
    });
  });

  test('same deployment in different execution paths produces distinct tree nodes', async () => {
    // gpt-4o appears in three execution chains: direct, under app-A, under app-B.
    // Each chain produces its own tree node (keyed by execution_path) so clicking
    // any one of them only toggles that single node — no cross-chain leakage.
    const rows = [
      {
        deployment: 'gpt-4o',
        parent_deployment: '',
        execution_path: 'gpt-4o',
        count: '10',
        money: '5',
        aggregated_money: '5',
        tokens_p: '100',
        tokens_c: '200',
      },
      {
        deployment: 'gpt-4o',
        parent_deployment: 'app-A',
        execution_path: 'app-A/gpt-4o',
        count: '3',
        money: '1',
        aggregated_money: '1',
        tokens_p: '30',
        tokens_c: '60',
      },
      {
        deployment: 'gpt-4o',
        parent_deployment: 'app-B',
        execution_path: 'app-B/gpt-4o',
        count: '2',
        money: '1',
        aggregated_money: '1',
        tokens_p: '20',
        tokens_c: '40',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      // 3 root rows visible (children collapsed by default):
      // - gpt-4o (direct, depth-1 path, root with no children)
      // - app-A (synthetic root, has gpt-4o as child)
      // - app-B (synthetic root, has gpt-4o as child)
      expect(Number(grid.getAttribute('data-row-count'))).toBe(3);
    });
  });

  test('REAL DATA: dial-rag with two instances each attaches its own children', async () => {
    // Two dial-rag rows (one direct, one under an applications/... ancestor).
    // gpt-4.1-2025-04-14 has TWO chains pointing to dial-rag — they must split:
    // one under direct dial-rag, one under the applications chain.
    const longApp = 'applications/9ynCk/Hope__0.0.3';
    const rows = [
      {
        deployment: longApp,
        parent_deployment: 'undefined',
        execution_path: longApp,
        count: '1',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'dial-rag',
        parent_deployment: longApp,
        execution_path: `${longApp}/dial-rag`,
        count: '1',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'dial-rag',
        parent_deployment: 'undefined',
        execution_path: 'dial-rag',
        count: '2',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'gpt-4.1-2025-04-14',
        parent_deployment: 'dial-rag',
        execution_path: `${longApp}/dial-rag/gpt-4.1-2025-04-14`,
        count: '1',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'gpt-4.1-2025-04-14',
        parent_deployment: 'dial-rag',
        execution_path: 'dial-rag/gpt-4.1-2025-04-14',
        count: '1',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      const summary = grid.getAttribute('data-summary');
      // Two roots visible: the app (with dial-rag inside) and the direct dial-rag.
      // Each root has 1 child — the gpt-4.1 attaches to the correct dial-rag instance.
      expect(summary).toBe(`${longApp}(1),dial-rag(1)`);
    });
  });

  test('REAL DATA: Ocr synthetic root with three siblings each having a dots-ocr child', async () => {
    // No row exists for "Ocr" — it's referenced as a parent by layout-detector,
    // markdown-extractor, tables-extractor. A synthetic "Ocr" root must be created.
    const rows = [
      {
        deployment: 'layout-detector',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/layout-detector',
        count: '34',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'markdown-extractor',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/markdown-extractor',
        count: '11',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'tables-extractor',
        parent_deployment: 'Ocr',
        execution_path: 'Ocr/tables-extractor',
        count: '8',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'dots-ocr',
        parent_deployment: 'layout-detector',
        execution_path: 'Ocr/layout-detector/dots-ocr',
        count: '34',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'dots-ocr',
        parent_deployment: 'markdown-extractor',
        execution_path: 'Ocr/markdown-extractor/dots-ocr',
        count: '11',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'dots-ocr',
        parent_deployment: 'tables-extractor',
        execution_path: 'Ocr/tables-extractor/dots-ocr',
        count: '8',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      // Single synthetic root "Ocr" with 3 children (layout-detector, markdown-extractor, tables-extractor)
      expect(grid.getAttribute('data-summary')).toBe('Ocr(3)');
    });
  });

  test('REAL DATA: world-economy-v2-hybrid root must have 2 children attached', async () => {
    // Mirror of actual BE rows the user pasted. The bug they reported: clicking
    // `world-economy-v2-hybrid` shows no children even though `gpt-4.1-2025-04-14`
    // and `text-embedding-3-large` reference it as their parent.
    const rows = [
      {
        deployment: 'world-economy-v2-hybrid',
        parent_deployment: 'undefined',
        execution_path: 'world-economy-v2-hybrid',
        count: '3',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'gpt-4.1-2025-04-14',
        parent_deployment: 'world-economy-v2-hybrid',
        execution_path: 'world-economy-v2-hybrid/gpt-4.1-2025-04-14',
        count: '32',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'text-embedding-3-large',
        parent_deployment: 'world-economy-v2-hybrid',
        execution_path: 'world-economy-v2-hybrid/text-embedding-3-large',
        count: '8',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      const summary = grid.getAttribute('data-summary');
      // Only the root visible while collapsed
      expect(Number(grid.getAttribute('data-row-count'))).toBe(1);
      // ...and that root should have 2 children attached
      expect(summary).toBe('world-economy-v2-hybrid(2)');
    });
  });

  test('deployment names containing `/` are treated as single entities (not split into segments)', async () => {
    // `applications/9ynCkZ.../v1` is one deployment, not three segments. The tree must
    // recognize ep === deployment as a root, never strip the deployment apart.
    const longName = 'applications/9ynCkZCVDkNMY1Rhww77oDUXJFJyr775NpIhasE92GWdaGRDr3k8t8criPxTMH3FLA/v1';
    const rows = [
      {
        deployment: longName,
        parent_deployment: '',
        execution_path: longName,
        count: '7',
        money: '1',
        aggregated_money: '1',
        tokens_p: '50',
        tokens_c: '100',
      },
      {
        deployment: 'gpt-4o',
        parent_deployment: longName,
        execution_path: `${longName}/gpt-4o`,
        count: '3',
        money: '0.5',
        aggregated_money: '0.5',
        tokens_p: '20',
        tokens_c: '40',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      // One root (the long-named app); its gpt-4o child is collapsed.
      expect(Number(grid.getAttribute('data-row-count'))).toBe(1);
    });
  });

  test('NEW BE format: escaped `\\/` inside execution_path correctly links rows whose name contains "/"', async () => {
    // BE rolled out an escape for slashes inside segments
    // (epam/ai-dial-analytics-realtime#245). A deployment named "a/b" under "x"
    // is now emitted as ep "x/a\/b" instead of the ambiguous "x/a/b". The tree
    // must still attach the child to its parent — i.e., stripDeploymentSuffix
    // must recognize the escaped form.
    const rows = [
      {
        deployment: 'x',
        parent_deployment: '',
        execution_path: 'x',
        count: '1',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'a/b',
        parent_deployment: 'x',
        execution_path: 'x/a\\/b',
        count: '2',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'c',
        parent_deployment: 'a/b',
        execution_path: 'x/a\\/b/c',
        count: '3',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      // Single root "x" with one direct child ("a/b"). Grandchild "c" is nested
      // under "a/b" and not visible while collapsed.
      expect(Number(grid.getAttribute('data-row-count'))).toBe(1);
      expect(grid.getAttribute('data-summary')).toBe('x(1)');
    });
  });

  test('OLD BE format: legacy `/`-only paths with slashy names still nest single-level', async () => {
    // Pre-escape data: a deployment "a/b" under "x" was emitted as "x/a/b".
    // We can't always disambiguate, but the row's own name + endsWith works at
    // the single-level boundary, so the child must still attach to its parent.
    const rows = [
      {
        deployment: 'x',
        parent_deployment: '',
        execution_path: 'x',
        count: '1',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
      {
        deployment: 'a/b',
        parent_deployment: 'x',
        execution_path: 'x/a/b',
        count: '2',
        money: '0',
        aggregated_money: '0',
        tokens_p: '0',
        tokens_c: '0',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      expect(grid.getAttribute('data-summary')).toBe('x(1)');
    });
  });

  test('3-level execution_path with missing intermediate ancestors stays distinct from siblings', async () => {
    // Two chains share an intermediate router but lead to the same final leaf name.
    // The two leaves must remain distinct tree nodes — they live on different paths.
    const rows = [
      {
        deployment: 'leaf',
        parent_deployment: 'router',
        execution_path: 'app-A/router/leaf',
        count: '5',
        money: '1',
        aggregated_money: '1',
        tokens_p: '10',
        tokens_c: '20',
      },
      {
        deployment: 'leaf',
        parent_deployment: 'router',
        execution_path: 'app-B/router/leaf',
        count: '7',
        money: '2',
        aggregated_money: '2',
        tokens_p: '15',
        tokens_c: '30',
      },
    ];
    getData = vi.fn<GetDataFn>().mockResolvedValue(makeTelemetryResponse(rows));
    render(<EntitiesConsumptionTree title="Entities" getData={getData} />);

    await waitFor(() => {
      const grid = screen.getByTestId('tree-grid');
      // Two synthetic roots: app-A and app-B. Each has its own router → leaf chain.
      expect(Number(grid.getAttribute('data-row-count'))).toBe(2);
    });
  });
});
