import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateRule } from '@/src/app/[lang]/enrichment-rules/actions';
import RuleDetailView from '@/src/components/Analytics/EnrichmentRules/RuleDetailView';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

/**
 * Only Monaco is stubbed, so the real EntityJsonEditor runs: its parse, its remount-on-external-change, and
 * the path from the typed document to the request all take part. The sibling spec stubs the whole editor.
 *
 * Uncontrolled on purpose: Monaco owns its buffer and is re-seeded by the editor's remount key, so a
 * controlled stub would fight the typing rather than reproduce it.
 */
vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ value, onChange, options }: any) => (
    <textarea
      aria-label="json document"
      readOnly={Boolean(options?.readOnly)}
      defaultValue={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const rule: EnrichmentRule = {
  id: 'rule-1',
  name: 'insights-live',
  evaluator_name: 'conversation-insights',
  evaluator_version: 2,
  evaluator: { name: 'conversation-insights', version: 2, type: EvaluatorType.Llm },
  target_enrichment: 'conversation_insights',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  filter_sql: 'turn_count > 1',
  grain_key: 'conversation_id',
  generation: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

const renderView = () => render(<RuleDetailView originalRule={rule} evaluators={[]} takenTargets={[]} />);

// Re-queried rather than cached: the editor may re-create the node, and a stale handle sends `paste` to
// document.body instead, which silently turns an assertion about typed text into an assertion about nothing.
const area = () => screen.getByLabelText('json document');

const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
  renderView();
  await user.click(within(screen.getByRole('switch')).getByRole('checkbox'));
};

const documentOf = () => JSON.parse((area() as HTMLTextAreaElement).value);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const write = async (user: ReturnType<typeof userEvent.setup>, next: any) => {
  await user.clear(area());
  await user.paste(JSON.stringify(next, null, 4));
};

const save = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateRule).mockResolvedValue({ success: true });
});

describe('RuleDetailView — the typed document reaches the request', () => {
  test('the document is the request: no members the service assigns', async () => {
    const user = userEvent.setup();
    await openEditor(user);

    const document = documentOf();
    expect(document).toMatchObject({ name: rule.name, filter_sql: rule.filter_sql });
    expect(document).not.toHaveProperty('id');
    expect(document).not.toHaveProperty('generation');
    expect(document).not.toHaveProperty('grain_key');
  });

  test('changing a member the fields do not present reaches the request', async () => {
    const user = userEvent.setup();
    await openEditor(user);

    await write(user, { ...documentOf(), rate_rpm: 120 });
    await save(user);

    expect(updateRule).toHaveBeenCalledWith(rule.id, expect.objectContaining({ rate_rpm: 120 }));
  });

  test('deleting the pinned evaluator version unpins the rule, with no error', async () => {
    const user = userEvent.setup();
    await openEditor(user);

    const withoutPin = { ...documentOf() };
    delete withoutPin.evaluator_version;
    await write(user, withoutPin);
    await save(user);

    expect(updateRule).toHaveBeenCalledWith(rule.id, expect.not.objectContaining({ evaluator_version: 2 }));
  });

  test('renaming saves under the new name against the same rule', async () => {
    const user = userEvent.setup();
    await openEditor(user);

    await write(user, { ...documentOf(), name: 'insights-live-v2' });
    await save(user);

    expect(updateRule).toHaveBeenCalledWith(rule.id, expect.objectContaining({ name: 'insights-live-v2' }));
  });

  test('a value of the wrong type neither breaks the page nor blocks the save', async () => {
    const user = userEvent.setup();
    await openEditor(user);

    await write(user, { ...documentOf(), name: 5 });

    expect(area()).toBeInTheDocument();
    await save(user);

    expect(updateRule).toHaveBeenCalled();
  });

  test('text that does not parse leaves the draft on its last good value', async () => {
    const user = userEvent.setup();
    await openEditor(user);

    await write(user, { ...documentOf(), filter_sql: 'turn_count > 5' });
    await user.click(area());
    await user.paste('  <-- not json');
    expect(() => documentOf()).toThrow();
    await save(user);

    expect(updateRule).toHaveBeenCalledWith(rule.id, expect.objectContaining({ filter_sql: 'turn_count > 5' }));
  });
});
