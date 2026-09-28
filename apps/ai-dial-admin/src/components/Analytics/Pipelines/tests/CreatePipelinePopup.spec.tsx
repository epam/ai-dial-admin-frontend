import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createPipeline, getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import CreatePipelinePopup from '@/src/components/Analytics/Pipelines/CreatePipelinePopup';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({
      id,
      label,
      options,
      value,
      onChange,
    }: {
      id: string;
      label?: string;
      options: { value: string; label: string }[];
      value?: string;
      onChange?: (next: string) => void;
    }) => (
      <label>
        {label ?? id}
        <select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
          <option value="">--</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ),
  };
});

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

const source: AnalyticsTable = {
  name: 'usage_daily',
  type: AnalyticsTableType.Source,
  columns: [{ source_name: 'calls', name: 'calls', type: AnalyticsFieldType.Long }],
};

describe('CreatePipelinePopup', () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();

  const renderPopup = (takenTargets: string[] = []) =>
    render(<CreatePipelinePopup takenTargets={takenTargets} onClose={onClose} onCreated={onCreated} />);

  const typeName = (name: string) => fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: name } });

  const selectTarget = async (user: ReturnType<typeof userEvent.setup>, name = enrichment.name) => {
    await waitFor(() =>
      expect(
        screen.getByLabelText(AnalyticsPipelinesI18nKey.Target).querySelector(`option[value="${name}"]`),
      ).toBeTruthy(),
    );
    return user.selectOptions(screen.getByLabelText(AnalyticsPipelinesI18nKey.Target), name);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment, source]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, source].find((table) => table.name === name) ?? null,
    );
    vi.mocked(createPipeline).mockResolvedValue({ success: true });
  });

  test('collects the name, the kind and the target, in that order', () => {
    renderPopup();

    const order = [AnalyticsPipelinesI18nKey.Name, AnalyticsPipelinesI18nKey.Kind, AnalyticsPipelinesI18nKey.Target];
    const rendered = document.body.textContent ?? '';
    const positions = order.map((key) => rendered.indexOf(key));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('leaves the declaration to the detail page', () => {
    renderPopup();

    [
      AnalyticsPipelinesI18nKey.SectionTransform,
      AnalyticsPipelinesI18nKey.TriggerKind,
      AnalyticsPipelinesI18nKey.SectionMeasures,
      AnalyticsPipelinesI18nKey.SectionInputs,
      AnalyticsPipelinesI18nKey.SectionAdvanced,
      AnalyticsPipelinesI18nKey.Filter,
    ].forEach((key) => expect(screen.queryByText(key)).toBeNull());
  });

  test('offers the targets of the selected kind', async () => {
    const user = userEvent.setup();
    renderPopup();

    const targetSelect = () => screen.getByLabelText(AnalyticsPipelinesI18nKey.Target);
    await waitFor(() => expect(targetSelect().querySelector(`option[value="${enrichment.name}"]`)).toBeTruthy());
    expect(targetSelect().querySelector(`option[value="${source.name}"]`)).toBeNull();

    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.KindAggregate));

    await waitFor(() => expect(targetSelect().querySelector(`option[value="${source.name}"]`)).toBeTruthy());
    expect(targetSelect().querySelector(`option[value="${enrichment.name}"]`)).toBeNull();
  });

  test('blocks submission until all three are set', async () => {
    const user = userEvent.setup();
    renderPopup();

    const submit = () => screen.getByRole('button', { name: ButtonsI18nKey.Create });
    expect(submit()).toBeDisabled();

    typeName('my-pipeline');
    expect(submit()).toBeDisabled();

    await selectTarget(user);
    await waitFor(() => expect(submit()).toBeEnabled());
  });

  test('refuses a name outside the identity grammar', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('My-Pipeline');
    await selectTarget(user);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });

  test('does not offer a target another pipeline already writes', async () => {
    renderPopup([enrichment.name]);

    await waitFor(() => expect(getTables).toHaveBeenCalled());
    expect(
      screen.getByLabelText(AnalyticsPipelinesI18nKey.Target).querySelector(`option[value="${enrichment.name}"]`),
    ).toBeNull();
  });

  test('registers either kind not running, sending no enabled member', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('my-pipeline');
    await selectTarget(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(createPipeline).toHaveBeenCalled());
    const dto = vi.mocked(createPipeline).mock.calls[0][0];
    expect(dto).toEqual({ name: 'my-pipeline', kind: PipelineKind.Enrich, target: enrichment.name });
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.Enabled)).toBeNull();
  });

  test('sends no trigger for a pipeline registered before one is chosen', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('my-pipeline');
    await selectTarget(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(createPipeline).toHaveBeenCalled());
    expect(vi.mocked(createPipeline).mock.calls[0][0]).not.toHaveProperty('trigger');
  });

  // Registration collects three fields and leaves the declaration unwritten, so the page that authors it
  // is where the operator goes next.
  test('opens the new pipeline on success', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('my-pipeline');
    await selectTarget(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pipelines/my-pipeline'));
  });

  test('closes, notifies and refreshes the listing on success', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('my-pipeline');
    await selectTarget(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalled();
  });

  test('reports the service failure, stays open and navigates nowhere', async () => {
    vi.mocked(createPipeline).mockResolvedValue({ success: false, errorMessage: 'target already bound' });
    const user = userEvent.setup();
    renderPopup();

    typeName('my-pipeline');
    await selectTarget(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification.mock.calls[0][0]).toMatchObject({ description: 'target already bound' });
    expect(onClose).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  test('discards its state when closed', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPopup();

    typeName('my-pipeline');
    await selectTarget(user);
    unmount();

    renderPopup();
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
  });
});
