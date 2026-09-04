import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createEvaluator } from '@/src/app/[lang]/evaluators/actions';
import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { Evaluator, EvaluatorPreset, EvaluatorType } from '@/src/models/analytics/evaluator';

vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div>rules grid</div> }));

/**
 * Only Monaco is stubbed here, so the real EntityJsonEditor takes part — the sibling spec stubs the whole
 * editor, which cannot catch a break between the typed document and the assembled request.
 *
 * The stub is uncontrolled on purpose: Monaco owns its buffer and is re-seeded by EntityJsonEditor's remount
 * key, not by a controlled value, so a controlled stub would fight the typing.
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

const llm: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  preset: EvaluatorPreset.ChatCompletion,
  model: 'gemini-2.5-flash-lite',
  params: { max_tokens: 700 },
  output_vars: [{ name: 'topic', type: 'string', jsonata: 'topic' }],
  created_at: '2026-08-19T10:00:00Z',
};

const stored = {
  name: llm.name,
  type: llm.type,
  preset: llm.preset,
  model: llm.model,
  params: llm.params,
  output_vars: llm.output_vars,
};

const renderView = () =>
  render(
    <EvaluatorDetailView evaluator={llm} summary={{ name: llm.name, latest_version: 4 }} referencingPipelines={[]} />,
  );

const version3: Evaluator = { ...llm, version: 3, model: 'gemini-1.5-pro' };

const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
  renderView();
  await user.click(within(screen.getByRole('switch')).getByRole('checkbox'));
  return screen.getByLabelText('json document');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const write = async (user: ReturnType<typeof userEvent.setup>, area: HTMLElement, next: any) => {
  await user.clear(area);
  await user.paste(JSON.stringify(next, null, 4));
};

const discardButton = () => screen.queryByRole('button', { name: ButtonsI18nKey.Discard });
const saveButton = () => screen.queryByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion });

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(saveButton() as HTMLElement);
  const confirm = screen.getAllByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion });
  await user.click(confirm[confirm.length - 1]);
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createEvaluator).mockResolvedValue({ success: true, response: { ...llm, version: 5 } });
});

describe('EvaluatorDetailView — the typed JSON reaches the request', () => {
  test('the document is seeded with the version and without the derived members', async () => {
    const user = userEvent.setup();
    const area = (await openEditor(user)) as HTMLTextAreaElement;

    expect(JSON.parse(area.value)).toEqual(stored);
  });

  test('changing an existing member surfaces Discard and Save', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    await write(user, area, { ...stored, model: 'gpt-4o' });

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
  });

  test('adding a member the console does not present surfaces Discard and Save', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    await write(user, area, { ...stored, some_new_knob: 42 });

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
  });

  test('a member the console does not present is registered as written', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    await write(user, area, { ...stored, some_new_knob: 42 });
    await submit(user);

    expect(createEvaluator).toHaveBeenCalledWith(expect.objectContaining({ some_new_knob: 42 }));
  });

  test('a params value the key/value editor cannot type is registered as written', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    // The fields recover a param's type by Number() coercion, so neither of these survives that path.
    await write(user, area, { ...stored, params: { stream: true, revision: '007', nested: { a: 1 } } });
    await submit(user);

    expect(createEvaluator).toHaveBeenCalledWith(
      expect.objectContaining({ params: { stream: true, revision: '007', nested: { a: 1 } } }),
    );
  });

  test('a member deleted in the document is absent from the request', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    const withoutParams = { ...stored };
    delete (withoutParams as { params?: unknown }).params;
    await write(user, area, withoutParams);
    await submit(user);

    expect(createEvaluator).toHaveBeenCalledWith(expect.not.objectContaining({ params: expect.anything() }));
  });

  test('changing only the name counts as no change', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    await write(user, area, { ...stored, name: 'somebody-elses-evaluator' });

    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();
  });

  test('a name changed in the document does not reach the request', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    await write(user, area, { ...stored, name: 'somebody-elses-evaluator', model: 'gpt-4o' });
    await submit(user);

    expect(createEvaluator).toHaveBeenCalledWith(expect.objectContaining({ name: llm.name }));
  });

  test('switching version while the editor holds unsaved edits replaces them without asking', async () => {
    const user = userEvent.setup();
    const view = render(
      <EvaluatorDetailView evaluator={llm} summary={{ name: llm.name, latest_version: 4 }} referencingPipelines={[]} />,
    );
    await user.click(within(screen.getByRole('switch')).getByRole('checkbox'));
    const area = screen.getByLabelText('json document');

    await write(user, area, { ...stored, model: 'gpt-4o' });
    expect(saveButton()).toBeInTheDocument();

    view.rerender(
      <EvaluatorDetailView
        evaluator={version3}
        summary={{ name: llm.name, latest_version: 4 }}
        referencingPipelines={[]}
      />,
    );

    const reseeded = screen.getByLabelText('json document') as HTMLTextAreaElement;
    expect(JSON.parse(reseeded.value).model).toBe('gemini-1.5-pro');
    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();
  });

  test('JSON that does not parse leaves the draft on its last good value', async () => {
    const user = userEvent.setup();
    const area = await openEditor(user);

    await write(user, area, { ...stored, model: 'gpt-4o' });
    await user.paste('  <-- not json');

    expect(saveButton()).toBeInTheDocument();
    await submit(user);

    expect(createEvaluator).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }));
  });
});
