import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createEvaluator } from '@/src/app/[lang]/evaluators/actions';
import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import { AnalyticsEvaluatorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { Evaluator, EvaluatorPreset, EvaluatorSummary, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';

vi.mock('@/src/app/[lang]/evaluators/actions');

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: EnrichmentRuleListItem[] }) => <div>rules: {rowData?.length ?? 0}</div>,
}));

const llm: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  preset: EvaluatorPreset.ChatCompletion,
  model: 'gemini-2.5-flash-lite',
  params: { max_tokens: 700 },
  request_template: '{"messages":[]}',
  response_schema: { type: 'object' },
  input_vars: [{ name: 'members', type: 'string', jsonata: '$join(members)' }],
  output_vars: [{ name: 'topic', type: 'string', jsonata: 'topic' }],
  created_at: '2026-08-19T10:00:00Z',
};

const sql: Evaluator = {
  name: 'usage-client-identity',
  version: 2,
  type: EvaluatorType.Sql,
  input_vars: [],
  output_vars: [{ name: 'session_id', type: 'string', sql: 'json_extract_string(request_tags, $1)' }],
  created_at: '2026-08-19T10:00:00Z',
};

const summary: EvaluatorSummary = {
  name: 'conversation-insights',
  latest_version: 4,
  created_at: '2026-08-17T10:00:00Z',
};

const rule: EnrichmentRuleListItem = {
  id: 'r_1',
  name: 'insights-live',
  evaluator_name: 'conversation-insights',
  evaluator_version: 2,
  evaluator: { name: 'conversation-insights', version: 2, type: EvaluatorType.Llm },
  target_enrichment: 'conversation_insights',
  grain_key: 'conversation_id',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  generation: 3,
  updated_at: '2026-08-21T09:37:29Z',
};

const renderView = (props?: Partial<Parameters<typeof EvaluatorDetailView>[0]>) =>
  render(<EvaluatorDetailView evaluator={llm} summary={summary} referencingRules={[rule]} {...props} />);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createEvaluator).mockResolvedValue({ success: true, response: { ...llm, version: 5 } });
});

describe('EvaluatorDetailView — tabs', () => {
  test('offers Properties and Rules', () => {
    renderView();

    expect(screen.getByText(TabsI18nKey.Properties)).toBeTruthy();
    expect(screen.getByText(TabsI18nKey.Rules)).toBeTruthy();
  });

  test('opens on Properties', () => {
    renderView();

    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Name)).toBeTruthy();
    expect(screen.queryByText(/^rules:/)).toBeNull();
  });

  test('shows the referencing rules on the Rules tab', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByText(TabsI18nKey.Rules));

    expect(screen.getByText(/^rules:/)).toHaveTextContent('rules: 1');
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Name)).toBeNull();
  });
});

describe('EvaluatorDetailView — Properties fields', () => {
  test('seeds the fields from the version shown', () => {
    renderView();

    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Name)).toHaveValue('conversation-insights');
    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model)).toHaveValue('gemini-2.5-flash-lite');
  });

  test('never lets the name be edited', () => {
    renderView();

    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Name)).toHaveAttribute('readonly');
  });

  test('omits the members a sql evaluator forbids', () => {
    renderView({ evaluator: sql, summary: { name: sql.name, latest_version: 2 } });

    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Model)).toBeNull();
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).toBeNull();
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.SectionInputVars)).toBeNull();
  });

  test('always presents the output variables', () => {
    renderView({ evaluator: sql, summary: { name: sql.name, latest_version: 2 } });

    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.SectionOutputVars)).toBeTruthy();
  });
});

describe('EvaluatorDetailView — saving as a new version', () => {
  test('offers nothing to save until something changes', () => {
    renderView();

    expect(screen.queryByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion })).toBeNull();
  });

  test('names the version it will create before posting, which is not the one after the version shown', async () => {
    const user = userEvent.setup();
    renderView({ evaluator: { ...llm, version: 2 } });

    await user.type(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model), 'x');
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    expect(screen.getByText(new RegExp(`${AnalyticsEvaluatorsI18nKey.NextVersion} 5`))).toBeTruthy();
  });

  test('says so in the confirmation when the latest version could not be read', async () => {
    const user = userEvent.setup();
    renderView({ summary: null, hasSummaryError: true });

    await user.type(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model), 'x');
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NextVersionUnknown)).toBeTruthy();
  });

  test('confirms before posting', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model), 'x');
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    expect(createEvaluator).not.toHaveBeenCalled();
    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.CreateConfirmTitle)).toBeTruthy();
  });

  test('posts the whole definition once confirmed', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model), 'x');
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    await waitFor(() => expect(createEvaluator).toHaveBeenCalledOnce());
    expect(vi.mocked(createEvaluator).mock.calls[0][0]).toMatchObject({
      name: 'conversation-insights',
      type: EvaluatorType.Llm,
      model: 'gemini-2.5-flash-litex',
      preset: EvaluatorPreset.ChatCompletion,
    });
  });

  test('opens the version the service actually created, not the predicted one', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model), 'x');
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    // A concurrent registration would make the prediction someone else's version.
    await waitFor(() => expect(push).toHaveBeenCalledWith('/evaluators/conversation-insights?version=5'));
  });
});
