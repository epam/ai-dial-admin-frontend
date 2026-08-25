import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { deleteRule, getEvaluators, getRules } from '@/src/app/[lang]/enrichment-rules/actions';
import EnrichmentRulesView from '@/src/components/Analytics/EnrichmentRules/EnrichmentRulesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ActionMenuOperationI18nKey, AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

interface MockActionItem {
  id: string;
  onClick?: (entity?: EnrichmentRuleListItem) => void;
}

interface MockColDef {
  colId?: string;
  field?: string;
  sortable?: boolean;
  valueGetter?: (params: { data: EnrichmentRuleListItem }) => unknown;
  cellRendererParams?: { items?: MockActionItem[] };
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: EnrichmentRuleListItem[]; columnDefs?: MockColDef[] }) => {
    const items = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    const versionColumn = columnDefs?.find((c) => c.colId === 'versionColumn');

    return (
      <div>
        <div>rows: {rowData?.length ?? 0}</div>
        <div>cols: {columnDefs?.map((c) => c.colId ?? c.field).join('|')}</div>
        <div>
          sortable:{' '}
          {columnDefs?.filter((c) => c.field !== ACTIONS_COLUMN_CEL_ID).some((c) => c.sortable === false)
            ? 'disabled'
            : 'not-disabled'}
        </div>
        {rowData?.map((row) => (
          <div key={row.id}>
            <span>{`version-column-${row.id}: ${versionColumn?.valueGetter?.({ data: row })}`}</span>
            {items.map((item) => (
              <button key={item.id} onClick={() => item.onClick?.(row)}>
                {item.id}:{row.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

const rule = (overrides: Partial<EnrichmentRuleListItem> = {}): EnrichmentRuleListItem => ({
  id: 'r_1',
  name: 'turn-feedback-live',
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target_enrichment: 'turn_feedback',
  source: 'response_ratings',
  grain_key: 'response_id',
  version_column: '_updated_at',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
  ...overrides,
});

describe('EnrichmentRules :: EnrichmentRulesView', () => {
  beforeEach(() => {
    vi.mocked(getEvaluators).mockResolvedValue([{ name: 'feedback-rollup', latest_version: 2 }]);
    vi.mocked(getRules).mockResolvedValue([rule()]);
    vi.mocked(deleteRule).mockResolvedValue({ success: true });
    showNotification.mockClear();
  });

  test('renders an empty grid rather than failing when no rule is registered', () => {
    render(<EnrichmentRulesView initialRules={[]} />);

    expect(screen.getByText('rows: 0')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)).not.toBeInTheDocument();
  });

  // An operator must be able to tell "nothing registered" from "the service is unreachable"; a bare
  // not-found page conflates the two.
  test('states the load failure instead of rendering as an empty registry', () => {
    render(<EnrichmentRulesView initialRules={[]} hasLoadError />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)).toBeInTheDocument();
    expect(screen.getByText('rows: 0')).toBeInTheDocument();
  });

  test('renders the seeded rules and the specified columns', () => {
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    expect(screen.getByText('rows: 1')).toBeInTheDocument();
    expect(screen.getByText(/cols:/)).toHaveTextContent(
      'name|target_enrichment|source|trigger|evaluator|grain_key|versionColumn|enabled|generation|updatedAt',
    );
  });

  test('renders an em dash when the read source declares no version column', () => {
    render(<EnrichmentRulesView initialRules={[rule({ version_column: undefined })]} />);

    expect(screen.getByText(`version-column-r_1: ${UNAVAILABLE_VALUE}`)).toBeInTheDocument();
  });

  test('does not re-request the listing on first render — the page already fetched it', () => {
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    expect(getRules).not.toHaveBeenCalled();
  });

  test('offers the create action to a full admin', async () => {
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CreateRule)).toBeEnabled());
  });

  // The modal is where the missing evaluator is visible and where submission is blocked; disabling the
  // action here would hide that explanation behind a control the operator cannot open.
  test('still offers the create action when no evaluator is registered', async () => {
    vi.mocked(getEvaluators).mockResolvedValue([]);

    render(<EnrichmentRulesView initialRules={[rule()]} />);

    await waitFor(() => expect(getEvaluators).toHaveBeenCalled());
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CreateRule)).toBeEnabled();
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.NoEvaluatorsNote)).not.toBeInTheDocument();
  });

  test('deletes a rule and refreshes the listing', async () => {
    const user = userEvent.setup();
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    expect(screen.getByText('turn-feedback-live')).toBeInTheDocument();

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.DeleteRule));

    await waitFor(() => expect(deleteRule).toHaveBeenCalledWith('r_1'));
    await waitFor(() => expect(getRules).toHaveBeenCalled());
  });

  test('reports a failed delete with the service message and keeps the row', async () => {
    vi.mocked(deleteRule).mockResolvedValue({
      success: false,
      errorHeader: 'rule_validation_failed',
      errorMessage: 'the rule is referenced elsewhere',
    });
    const user = userEvent.setup();
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.DeleteRule));

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'rule_validation_failed', description: 'the rule is referenced elsewhere' }),
      ),
    );
    expect(screen.getByText('rows: 1')).toBeInTheDocument();
  });

  test('a failed re-fetch leaves the previously fetched rows in place', async () => {
    const user = userEvent.setup();
    vi.mocked(getRules).mockResolvedValue(null);
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.DeleteRule));

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed }),
      ),
    );
    expect(screen.getByText('rows: 1')).toBeInTheDocument();
  });

  test('a delete refresh re-reads the whole registry', async () => {
    const user = userEvent.setup();
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.DeleteRule));

    await waitFor(() => expect(getRules).toHaveBeenCalledWith());
  });

  test('clears a seeded load failure once a re-fetch succeeds', async () => {
    const user = userEvent.setup();
    render(<EnrichmentRulesView initialRules={[rule()]} hasLoadError />);
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)).toBeInTheDocument();

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.DeleteRule));

    await waitFor(() =>
      expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.RulesLoadFailed)).not.toBeInTheDocument(),
    );
  });

  // Narrowing is the grid's job now that the toolbar is gone, so no data column may opt out of it.
  test('leaves every data column sortable through the grid', () => {
    render(<EnrichmentRulesView initialRules={[rule()]} />);

    expect(screen.getByText(/sortable:/)).toHaveTextContent('sortable: not-disabled');
  });
});
