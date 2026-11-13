import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import { getModelsListAction } from '@/src/app/[lang]/models/actions';
import { getEnrichmentRoutes } from '@/src/app/[lang]/system-properties/actions';
import TransformSection from '@/src/components/Analytics/Pipelines/Enrich/TransformSection';
import { EnrichFormState } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { TransformPreset, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { TransformDraft } from '@/src/models/analytics/pipeline-ui';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/[lang]/system-properties/actions');
vi.mock('@/src/app/[lang]/applications/actions');
vi.mock('@/src/app/[lang]/models/actions');

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Select: ({ id, labelProps, options, value, onChange }: any) => (
    <select id={id} aria-label={labelProps?.label} value={value} onChange={(e: any) => onChange(e.target.value)}>
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/src/components/Analytics/Pipelines/Enrich/OutputsEditor', () => ({ default: () => null }));
vi.mock('@/src/components/Analytics/Pipelines/Enrich/VariablesEditor', () => ({ default: () => null }));
vi.mock('@/src/components/Analytics/Pipelines/Enrich/TransformParamsEditor', () => ({ default: () => null }));
vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({ default: () => null }));

const APPLICATIONS = [{ name: 'insights-app', routes: [{ paths: ['/insights', '/summary'] }] }] as DialApplication[];

const MODELS = [{ name: 'gpt-4o' }, { name: 'gemini-flash' }] as DialModel[];

const ROUTE_TRANSFORM: TransformDraft = {
  type: TransformType.Llm,
  preset: TransformPreset.DialAppRoute,
  model: 'insights-app',
  route: 'insights',
};

const { showNotification } = useNotification();
const onTransformChange = vi.fn();

const Host = ({ seed, triggerKind }: { seed: TransformDraft; triggerKind: TriggerKind }) => {
  const [transform, setTransform] = useState(seed);

  const form = {
    transform,
    onTransformChange: (patch: Partial<TransformDraft>) => {
      onTransformChange(patch);
      setTransform((prev) => ({ ...prev, ...patch }));
    },
    isTransformReady: true,
    targetColumns: [],
    draft: { trigger: { kind: triggerKind } },
    sourceFields: [],
    isVariablesReady: true,
    hasSourceEntityError: false,
  } as unknown as EnrichFormState;

  return <TransformSection form={form} />;
};

const renderSection = (seed: TransformDraft, triggerKind = TriggerKind.Schedule) =>
  render(<Host seed={seed} triggerKind={triggerKind} />);

const modelField = () => screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.Model });
const presetSelect = () => screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.Preset });
const deploymentField = () => screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.RouteDeployment });
const routeField = () => screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.Route });
const statementLink = () =>
  within(screen.getByRole('status')).queryByRole('link', { name: AnalyticsPipelinesI18nKey.RouteNotAllowedLink });
const findStatementLink = () => screen.findByRole('link', { name: AnalyticsPipelinesI18nKey.RouteNotAllowedLink });

describe('TransformSection — the call preset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApplications).mockResolvedValue({ success: true, response: APPLICATIONS });
    vi.mocked(getModelsListAction).mockResolvedValue({ success: true, response: MODELS });
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({
      success: true,
      response: [{ deployment: 'insights-app', route: 'insights' }],
    });
  });

  test('presents a transform with no preset as chat completion, with the model field', () => {
    renderSection({ type: TransformType.Llm, model: 'gpt-4o' });

    expect(presetSelect()).toHaveDisplayValue(AnalyticsPipelinesI18nKey.PresetChatCompletion);
    expect(modelField()).toHaveDisplayValue('gpt-4o');
    expect(screen.queryByRole('combobox', { name: AnalyticsPipelinesI18nKey.Route })).toBeNull();
    expect(onTransformChange).not.toHaveBeenCalled();
  });

  test('reads no allowlist under chat completion', () => {
    renderSection({ type: TransformType.Llm, model: 'gpt-4o' });

    expect(getEnrichmentRoutes).not.toHaveBeenCalled();
  });

  test('suggests the models and the applications for the chat-completion deployment', async () => {
    const user = userEvent.setup();
    renderSection({ type: TransformType.Llm });

    await user.click(modelField());
    const options = within(await screen.findByRole('listbox'));

    expect(await options.findByRole('option', { name: 'gemini-flash' })).toBeTruthy();
    expect(options.getByRole('option', { name: 'insights-app' })).toBeTruthy();
  });

  test('writes a picked model and keeps a typed one that matches no suggestion', async () => {
    const user = userEvent.setup();
    renderSection({ type: TransformType.Llm });
    const field = modelField();

    await user.click(field);
    await user.click(await screen.findByRole('option', { name: 'gpt-4o' }));
    expect(onTransformChange).toHaveBeenLastCalledWith({ model: 'gpt-4o' });

    await user.clear(field);
    await user.type(field, 'unlisted-model');
    expect(field).toHaveDisplayValue('unlisted-model');
  });

  test('keeps the model field usable when the listings fail', async () => {
    vi.mocked(getModelsListAction).mockResolvedValue({ success: false, errorMessage: 'Forbidden' });
    vi.mocked(getApplications).mockResolvedValue({ success: false, errorMessage: 'Forbidden' });
    const user = userEvent.setup();
    renderSection({ type: TransformType.Llm });

    await user.type(modelField(), 'typed-model');

    expect(onTransformChange).toHaveBeenLastCalledWith({ model: 'typed-model' });
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('presents the application and route fields once the route preset is chosen', async () => {
    const user = userEvent.setup();
    renderSection({ type: TransformType.Llm, model: 'insights-app' });

    await user.selectOptions(presetSelect(), TransformPreset.DialAppRoute);

    expect(onTransformChange).toHaveBeenCalledWith({ preset: TransformPreset.DialAppRoute });
    expect(deploymentField()).toHaveDisplayValue('insights-app');
    expect(routeField()).toHaveDisplayValue('');
    expect(screen.queryByRole('combobox', { name: AnalyticsPipelinesI18nKey.Model })).toBeNull();
  });

  test('presents neither a preset nor a route for a sql transform', () => {
    renderSection({ ...ROUTE_TRANSFORM, type: TransformType.Sql });

    expect(screen.queryByRole('combobox', { name: AnalyticsPipelinesI18nKey.Preset })).toBeNull();
    expect(screen.queryByRole('combobox', { name: AnalyticsPipelinesI18nKey.Route })).toBeNull();
    expect(getEnrichmentRoutes).not.toHaveBeenCalled();
    expect(getApplications).not.toHaveBeenCalled();
    expect(getModelsListAction).not.toHaveBeenCalled();
  });

  test('keeps a preset the console does not know as the stored value', () => {
    renderSection({ type: TransformType.Llm, preset: 'future_preset' as TransformPreset });

    expect(presetSelect()).toHaveDisplayValue('future_preset');
  });

  test('suggests the routes of the application the deployment names', async () => {
    const user = userEvent.setup();
    renderSection({ ...ROUTE_TRANSFORM, route: '' });

    await user.click(routeField());

    expect(within(await screen.findByRole('listbox')).getByRole('option', { name: 'summary' })).toBeTruthy();
  });

  test('writes a typed route to the transform and marks a malformed one', async () => {
    const user = userEvent.setup();
    renderSection({ ...ROUTE_TRANSFORM, route: '' });

    await user.type(routeField(), '/x');

    expect(onTransformChange).toHaveBeenLastCalledWith({ route: '/x' });
    expect(screen.getByText(AnalyticsPipelinesI18nKey.RouteMalformed)).toBeTruthy();
  });

  test('does not mark a blank route', () => {
    renderSection({ ...ROUTE_TRANSFORM, route: '' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RouteRequired)).toBeNull();
  });
});

describe('TransformSection — the allowlist statement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApplications).mockResolvedValue({ success: true, response: APPLICATIONS });
    vi.mocked(getModelsListAction).mockResolvedValue({ success: true, response: MODELS });
  });

  test('states an unlisted pair and links to System Properties', async () => {
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({
      success: true,
      response: [{ deployment: 'insights-app', route: 'summary' }],
    });
    renderSection(ROUTE_TRANSFORM);

    expect((await findStatementLink()).getAttribute('href')).toContain(ApplicationRoute.SystemProperties);
    expect(screen.getByRole('status').textContent).toContain(AnalyticsPipelinesI18nKey.RouteNotAllowed);
  });

  test('states every pair when no allowlist is stored', async () => {
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({ success: true });
    renderSection(ROUTE_TRANSFORM);

    expect(await findStatementLink()).toBeTruthy();
  });

  test('shows nothing for a listed pair', async () => {
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({
      success: true,
      response: [
        { deployment: 'insights-app', route: 'summary' },
        { deployment: 'insights-app', route: 'insights' },
      ],
    });
    const user = userEvent.setup();
    renderSection({ ...ROUTE_TRANSFORM, route: 'other' });
    expect(await findStatementLink()).toBeTruthy();

    await user.clear(routeField());
    await user.type(routeField(), 'summary');

    expect(statementLink()).toBeNull();
  });

  test('shows no statement and no error when the allowlist read is refused', async () => {
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({ success: false, status: 403, errorMessage: 'Forbidden' });
    const user = userEvent.setup();
    renderSection({ ...ROUTE_TRANSFORM, route: '' });

    await user.type(routeField(), 'insights');

    expect(routeField()).toHaveDisplayValue('insights');
    expect(statementLink()).toBeNull();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('shows no statement while the pair is incomplete', async () => {
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderSection({ ...ROUTE_TRANSFORM, route: 'insights' });
    expect(await findStatementLink()).toBeTruthy();

    await user.clear(routeField());

    expect(statementLink()).toBeNull();
  });
});

describe('TransformSection — the json placeholder form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApplications).mockResolvedValue({ success: true, response: APPLICATIONS });
    vi.mocked(getModelsListAction).mockResolvedValue({ success: true, response: MODELS });
  });

  test('names the json form beside the template', () => {
    renderSection({ type: TransformType.Llm });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.PlaceholderJsonForm)).toBeTruthy();
  });

  test('accepts a json members placeholder at group grain', () => {
    renderSection({ type: TransformType.Llm, request_template: '{"members": {{members:json}}}' }, TriggerKind.Group);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.MembersPlaceholderMissing)).toBeNull();
  });

  test('still reports a group template that references no members', () => {
    renderSection({ type: TransformType.Llm, request_template: '{"x": "{{other:json}}"}' }, TriggerKind.Group);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.MembersPlaceholderMissing)).toBeTruthy();
  });
});
