import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { evaluateTryOutColumnSections } from '@/src/components/TestSuites/utils/evaluate-columns';
import {
  ColumnExtractionStatus,
  EvaluatedColumn,
  NotExtractedReason,
  TryOutColumnResults,
} from '@/src/components/TestSuites/utils/models';
import { TestSuitesI18nKey, ValidityStatusI18nKey } from '@/src/constants/i18n';
import { ResponseColumn, SuiteType, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import TryOutColumns from '../components/TryOutColumns';

vi.mock('@/src/components/TestSuites/utils/evaluate-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/components/TestSuites/utils/evaluate-columns')>();
  return {
    ...actual,
    evaluateTryOutColumnSections: vi.fn(() => Promise.resolve({ shape: 'single', flatColumns: [] })),
  };
});

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <span data-testid="collapsible-title">{title}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <div>JsonEditor:{JSON.stringify(entity)}</div>,
}));

vi.mock('@/src/components/Common/CopyButton/CopyButton', () => ({
  default: () => <button type="button">Copy</button>,
}));

const makeColumn = (overrides: Partial<ResponseColumn> = {}): ResponseColumn => ({
  name: 'testCol',
  displayName: 'testCol',
  expression: 'foo',
  type: 'STRING',
  ...overrides,
});

const makeEvaluatedColumn = (overrides: Partial<EvaluatedColumn> = {}): EvaluatedColumn => ({
  name: 'testCol',
  expression: 'foo',
  type: 'STRING',
  result: 'bar',
  status: ColumnExtractionStatus.Extracted,
  ...overrides,
});

const baseSuite: TestSuite = { suiteType: SuiteType.Deployment };

const entry = (body: unknown, out: unknown): TryOutHistoryEntry => ({
  resolvedRequest: { body },
  response: { statusCode: 200, body: out },
});

describe('TryOutColumns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders flat Results section for single-request suites', async () => {
    vi.mocked(evaluateTryOutColumnSections).mockResolvedValueOnce({
      shape: 'single',
      flatColumns: [makeEvaluatedColumn()],
    });

    render(
      <TryOutColumns
        testSuite={baseSuite}
        columns={[makeColumn()]}
        response={{ foo: 'bar' }}
        responseBody={<div>FlatResponseBody</div>}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('testCol')).toBeInTheDocument();
    });
    expect(screen.getByText(TestSuitesI18nKey.Results)).toBeInTheDocument();
    expect(screen.getByText('FlatResponseBody')).toBeInTheDocument();
    expect(evaluateTryOutColumnSections).toHaveBeenCalledWith(
      expect.objectContaining({
        testSuite: baseSuite,
        fallbackColumns: [makeColumn()],
        fallbackResponse: { foo: 'bar' },
      }),
    );
  });

  test('renders selected request columns for multi-request history', async () => {
    const threeRequestSuite: TestSuite = {
      suiteType: SuiteType.Deployment,
      responseColumns: [makeColumn({ name: 'answer' })],
      additionalRequests: [
        { responseColumns: [makeColumn({ name: 'is_correct' })] },
        { responseColumns: [makeColumn({ name: 'result' })] },
      ],
    };

    vi.mocked(evaluateTryOutColumnSections).mockResolvedValue({
      shape: 'requests',
      groups: [
        {
          requestIndex: 0,
          showTurnLabels: false,
          turns: [
            {
              turnIndex: 0,
              columns: [makeEvaluatedColumn({ name: 'answer', result: 'A' })],
              responseBody: { out: 'a' },
            },
          ],
        },
        {
          requestIndex: 1,
          showTurnLabels: false,
          turns: [
            {
              turnIndex: 0,
              columns: [makeEvaluatedColumn({ name: 'is_correct', result: 'true' })],
              responseBody: { out: 'b' },
            },
          ],
        },
        {
          requestIndex: 2,
          showTurnLabels: false,
          turns: [
            {
              turnIndex: 0,
              columns: [makeEvaluatedColumn({ name: 'result', result: 'ok' })],
              responseBody: { out: 'c' },
            },
          ],
        },
      ],
    });

    const history = [entry({ req: 1 }, { out: 'a' }), entry({ req: 2 }, { out: 'b' }), entry({ req: 3 }, { out: 'c' })];

    const { rerender } = render(
      <TryOutColumns
        testSuite={threeRequestSuite}
        history={history}
        columns={threeRequestSuite.responseColumns}
        response={{ top: true }}
        responseBody={<div>TopLevelEnvelope</div>}
        selectedRequestIndex={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('answer')).toBeInTheDocument();
    });

    expect(screen.getByText('JsonEditor:{"out":"a"}')).toBeInTheDocument();
    expect(screen.queryByText('JsonEditor:{"out":"b"}')).not.toBeInTheDocument();
    expect(screen.queryByText('TopLevelEnvelope')).not.toBeInTheDocument();
    expect(screen.queryByText('is_correct')).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.Results)).not.toBeInTheDocument();

    rerender(
      <TryOutColumns
        testSuite={threeRequestSuite}
        history={history}
        columns={threeRequestSuite.responseColumns}
        response={{ top: true }}
        responseBody={<div>TopLevelEnvelope</div>}
        selectedRequestIndex={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('is_correct')).toBeInTheDocument();
    });
    expect(screen.getByText('JsonEditor:{"out":"b"}')).toBeInTheDocument();
    expect(screen.queryByText('answer')).not.toBeInTheDocument();
  });

  test('shows Turn labels inside the active request tab for combined suites', async () => {
    vi.mocked(evaluateTryOutColumnSections).mockResolvedValueOnce({
      shape: 'combined',
      groups: [
        {
          requestIndex: 0,
          showTurnLabels: true,
          turns: [
            {
              turnIndex: 0,
              columns: [makeEvaluatedColumn({ name: 'answer', result: 'a' })],
              responseBody: { out: 'a' },
            },
            {
              turnIndex: 1,
              columns: [makeEvaluatedColumn({ name: 'answer', result: 'b' })],
              responseBody: { out: 'b' },
            },
          ],
        },
        {
          requestIndex: 1,
          showTurnLabels: true,
          turns: [
            {
              turnIndex: 0,
              columns: [makeEvaluatedColumn({ name: 'is_correct', result: 'yes' })],
              responseBody: { out: 'c' },
            },
          ],
        },
      ],
    } satisfies TryOutColumnResults);

    render(
      <TryOutColumns
        testSuite={{
          suiteType: SuiteType.Deployment,
          inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
          additionalRequests: [{ inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }] }],
        }}
        history={[
          entry({ r: 0, t: 0 }, { out: 'a' }),
          entry({ r: 0, t: 1 }, { out: 'b' }),
          entry({ r: 1, t: 0 }, { out: 'c' }),
        ]}
        schema={[]}
        multiTurnData={[{ prompt: 'a' }, { prompt: 'b' }]}
        response={{}}
        responseBody={null}
        selectedRequestIndex={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(2);
    });

    expect(screen.getByText('JsonEditor:{"out":"a"}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"out":"b"}')).toBeInTheDocument();
    expect(screen.queryByText('JsonEditor:{"out":"c"}')).not.toBeInTheDocument();
  });

  test('passes the reported extraction through as the invocation', async () => {
    vi.mocked(evaluateTryOutColumnSections).mockResolvedValueOnce({ shape: 'single', flatColumns: [] });

    const invocation = {
      response: { statusCode: 200 },
      extractedColumns: { testCol: 'bar' },
      extractionWarnings: [],
    };

    render(
      <TryOutColumns testSuite={baseSuite} columns={[makeColumn()]} invocation={invocation} responseBody={null} />,
    );

    await waitFor(() => {
      expect(evaluateTryOutColumnSections).toHaveBeenCalledWith(
        expect.objectContaining({ fallbackInvocation: invocation }),
      );
    });
  });

  describe('column result cards', () => {
    const renderColumns = async (columns: EvaluatedColumn[]) => {
      vi.mocked(evaluateTryOutColumnSections).mockResolvedValueOnce({ shape: 'single', flatColumns: columns });

      render(<TryOutColumns testSuite={baseSuite} columns={[makeColumn()]} responseBody={null} />);

      await waitFor(() => {
        expect(screen.getByText(columns[0].name)).toBeInTheDocument();
      });
    };

    test('an extracted column shows its value and the valid badge', async () => {
      await renderColumns([makeEvaluatedColumn({ result: 'Hi there, friend!' })]);

      expect(screen.getByRole('group', { name: TestSuitesI18nKey.ColumnResultLabel })).toBeInTheDocument();
      expect(screen.getByText('Hi there, friend!')).toBeInTheDocument();
      expect(screen.getByText(ValidityStatusI18nKey.Valid)).toBeInTheDocument();
    });

    test('a failed column shows the backend error and no value', async () => {
      await renderColumns([
        makeEvaluatedColumn({
          name: 'summary',
          result: '',
          status: ColumnExtractionStatus.Failed,
          error: 'Expression matched nothing',
        }),
      ]);

      expect(screen.getByText('Expression matched nothing')).toBeInTheDocument();
      expect(screen.getByText(ValidityStatusI18nKey.Invalid)).toBeInTheDocument();
    });

    test.each([
      [NotExtractedReason.RequestFailed, TestSuitesI18nKey.ColumnNotExtractedRequestFailed],
      [NotExtractedReason.StreamIncomplete, TestSuitesI18nKey.ColumnNotExtractedStreamIncomplete],
      [NotExtractedReason.NoExtractionReported, TestSuitesI18nKey.ColumnNotExtractedNoneReported],
    ])('a not-extracted column states its reason (%s)', async (reason, reasonKey) => {
      await renderColumns([
        makeEvaluatedColumn({
          result: '',
          status: ColumnExtractionStatus.NotExtracted,
          reason,
          statusCode: 401,
        }),
      ]);

      expect(screen.getByText(TestSuitesI18nKey.ColumnNotExtracted)).toBeInTheDocument();
      expect(screen.getByText(reasonKey)).toBeInTheDocument();
      expect(screen.getByRole('group', { name: TestSuitesI18nKey.ColumnResultLabel })).toBeInTheDocument();
    });

    test('all three kinds render together, each addressable by role', async () => {
      await renderColumns([
        makeEvaluatedColumn({ name: 'answer' }),
        makeEvaluatedColumn({ name: 'summary', status: ColumnExtractionStatus.Failed, result: '' }),
        makeEvaluatedColumn({
          name: 'id',
          status: ColumnExtractionStatus.NotExtracted,
          reason: NotExtractedReason.RequestFailed,
          result: '',
        }),
      ]);

      expect(screen.getAllByRole('group', { name: TestSuitesI18nKey.ColumnResultLabel })).toHaveLength(3);
    });
  });

  test('renders no column rows when evaluation returns empty flat results', async () => {
    vi.mocked(evaluateTryOutColumnSections).mockResolvedValueOnce({
      shape: 'single',
      flatColumns: [],
    });

    render(
      <TryOutColumns testSuite={baseSuite} columns={[makeColumn()]} response={{}} request={{}} responseBody={null} />,
    );

    await waitFor(() => {
      expect(screen.queryByText('testCol')).not.toBeInTheDocument();
    });
  });
});
