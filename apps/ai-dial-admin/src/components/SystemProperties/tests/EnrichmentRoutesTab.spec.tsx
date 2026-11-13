import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getApplications } from '@/src/app/[lang]/applications/actions';
import {
  getEnrichmentRoutes,
  saveEnrichmentRoutes,
  saveSessionsSource,
  updateProperties,
} from '@/src/app/[lang]/system-properties/actions';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { EnrichmentRoute } from '@/src/models/analytics/enrichment-routes';
import { DialApplication } from '@/src/models/dial/application';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock('@/src/app/[lang]/system-properties/actions');
vi.mock('@/src/app/[lang]/applications/actions');

vi.mock('@/src/components/EntityView/Interceptors/GlobalInterceptors', () => ({
  default: ({ onChangeInterceptors }: { onChangeInterceptors: (interceptors: string[]) => void }) => (
    <button onClick={() => onChangeInterceptors(['new-interceptor'])}>change-interceptors</button>
  ),
}));

const STORED: EnrichmentRoute[] = [
  { deployment: 'insights-app', route: 'insights' },
  { deployment: 'insights-app', route: 'summary' },
];

const APPLICATIONS = [
  { name: 'insights-app', routes: [{ paths: ['/insights', '/summary'] }] },
  { name: 'ratings-app', routes: [{ paths: ['/rate'] }] },
] as DialApplication[];

const { showNotification } = useNotification();

const deploymentField = (position: number) =>
  screen.getByRole('combobox', { name: `${AnalyticsPipelinesI18nKey.RouteDeployment} ${position}` });
const routeField = (position: number) =>
  screen.getByRole('combobox', { name: `${AnalyticsPipelinesI18nKey.Route} ${position}` });
const addButton = () => screen.getByRole('button', { name: SystemPropertiesI18nKey.EnrichmentRoutesAdd });
const removeButton = (position: number) =>
  screen.getByRole('button', { name: `${SystemPropertiesI18nKey.EnrichmentRoutesRemove} ${position}` });
const saveButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });

const renderSystemProperties = (isAnalyticsEnabled = true) =>
  render(
    <SaveValidationContextProvider>
      <SystemProperties
        interceptors={[]}
        globalSettings={{ globalInterceptors: [] }}
        doesSettingsExist
        isAnalyticsEnabled={isAnalyticsEnabled}
      />
    </SaveValidationContextProvider>,
  );

const openTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(SystemPropertiesI18nKey.EnrichmentRoutesTitle));
};

const openLoadedTab = async (user: ReturnType<typeof userEvent.setup>) => {
  renderSystemProperties();
  await openTab(user);
  await vi.waitFor(() => expect(addButton()).toBeEnabled());
};

describe('SystemProperties — Enrichment routes tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext().isReadOnlyAdmin = false;
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({ success: true, response: STORED });
    vi.mocked(saveEnrichmentRoutes).mockImplementation(async (routes) => ({ success: true, response: routes }));
    vi.mocked(getApplications).mockResolvedValue({ success: true, response: APPLICATIONS });
  });

  test('offers no tab and reads nothing when analytics is disabled', () => {
    renderSystemProperties(false);

    expect(screen.queryByText(SystemPropertiesI18nKey.EnrichmentRoutesTitle)).toBeNull();
    expect(getEnrichmentRoutes).not.toHaveBeenCalled();
  });

  test('reads nothing until the tab is opened', () => {
    renderSystemProperties();

    expect(screen.getByText(SystemPropertiesI18nKey.EnrichmentRoutesTitle)).toBeTruthy();
    expect(getEnrichmentRoutes).not.toHaveBeenCalled();
    expect(getApplications).not.toHaveBeenCalled();
  });

  test('presents the stored pairs in their written order with the rule they govern', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    expect(deploymentField(1)).toHaveDisplayValue('insights-app');
    expect(routeField(1)).toHaveDisplayValue('insights');
    expect(routeField(2)).toHaveDisplayValue('summary');
    expect(screen.getByText(SystemPropertiesI18nKey.EnrichmentRoutesDescription)).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('presents an empty list without an error when no allowlist is stored', async () => {
    const user = userEvent.setup();
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({ success: true });
    await openLoadedTab(user);

    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('saves the stored pairs followed by an added one and confirms it', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.click(addButton());
    await user.type(deploymentField(3), 'new-app');
    await user.type(routeField(3), 'v1/rate');
    await user.click(saveButton());

    expect(saveEnrichmentRoutes).toHaveBeenCalledWith([...STORED, { deployment: 'new-app', route: 'v1/rate' }]);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: SystemPropertiesI18nKey.EnrichmentRoutesSaved }),
    );
    expect(updateProperties).not.toHaveBeenCalled();
    expect(saveSessionsSource).not.toHaveBeenCalled();
  });

  test('saves an emptied list', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.click(removeButton(2));
    await user.click(removeButton(1));
    await user.click(saveButton());

    expect(saveEnrichmentRoutes).toHaveBeenCalledWith([]);
  });

  test('does not send a row left blank', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.click(addButton());
    await user.click(removeButton(1));
    await user.click(saveButton());

    expect(saveEnrichmentRoutes).toHaveBeenCalledWith([STORED[1]]);
  });

  test('states the path rule, disables Save and marks the tab for a malformed route', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.clear(routeField(1));
    await user.type(routeField(1), '/insights');

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RouteMalformed)).toBeTruthy();
    expect(saveButton()).toBeDisabled();
    expect(
      screen.getByRole('tab', { name: new RegExp(SystemPropertiesI18nKey.EnrichmentRoutesTitle.replace('.', '\\.')) })
        .textContent,
    ).not.toBe(SystemPropertiesI18nKey.EnrichmentRoutesTitle);
  });

  test('reports a repeated pair on the later row', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.clear(routeField(2));
    await user.type(routeField(2), 'insights');

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RouteRepeated)).toBeTruthy();
    expect(saveButton()).toBeDisabled();
  });

  test('keeps pairs that differ only in case', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.clear(routeField(2));
    await user.type(routeField(2), 'Insights');

    expect(saveButton()).toBeEnabled();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RouteRepeated)).toBeNull();
  });

  test('reports a refused write in the service words and keeps the edits', async () => {
    const user = userEvent.setup();
    vi.mocked(saveEnrichmentRoutes).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'An enabled pipeline calls a dropped pair: nightly-insights',
    });
    await openLoadedTab(user);

    await user.click(removeButton(2));
    await user.click(saveButton());

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Conflict',
        description: 'An enabled pipeline calls a dropped pair: nightly-insights',
      }),
    );
    expect(showNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: SystemPropertiesI18nKey.EnrichmentRoutesSaved }),
    );
    expect(screen.queryAllByRole('combobox')).toHaveLength(2);
    expect(saveButton()).toBeTruthy();
  });

  test('reports a failed read and offers nothing to edit or save', async () => {
    const user = userEvent.setup();
    vi.mocked(getEnrichmentRoutes).mockResolvedValue({ success: false, errorMessage: 'Service unavailable' });
    renderSystemProperties();
    await openTab(user);

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: SystemPropertiesI18nKey.EnrichmentRoutesReadFailed,
          description: 'Service unavailable',
        }),
      ),
    );
    expect(addButton()).toBeDisabled();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('disables every control for a read-only admin', async () => {
    const user = userEvent.setup();
    useAppContext().isReadOnlyAdmin = true;
    renderSystemProperties();
    await openTab(user);

    await vi.waitFor(() => expect(deploymentField(1)).toHaveDisplayValue('insights-app'));
    expect(deploymentField(1)).toBeDisabled();
    expect(routeField(1)).toBeDisabled();
    expect(removeButton(1)).toBeDisabled();
    expect(addButton()).toBeDisabled();
    useAppContext().isReadOnlyAdmin = false;
  });

  test('suggests the applications, then the routes of the one picked', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.click(addButton());
    await user.click(deploymentField(3));
    await user.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'ratings-app' }));
    await user.click(routeField(3));

    expect(within(await screen.findByRole('listbox')).getByRole('option', { name: 'rate' })).toBeTruthy();
    expect(deploymentField(3)).toHaveDisplayValue('ratings-app');
  });

  test('accepts typed values when the applications cannot be listed', async () => {
    const user = userEvent.setup();
    vi.mocked(getApplications).mockResolvedValue({ success: false, errorMessage: 'Forbidden' });
    await openLoadedTab(user);

    await user.click(addButton());
    await user.type(deploymentField(3), 'typed-app');
    await user.type(routeField(3), 'typed');

    expect(saveButton()).toBeEnabled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('discards the unsaved rows back to the stored list', async () => {
    const user = userEvent.setup();
    await openLoadedTab(user);

    await user.click(removeButton(2));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(routeField(2)).toHaveDisplayValue('summary');
  });

  test('saving global interceptors sends no allowlist write', async () => {
    const user = userEvent.setup();
    vi.mocked(updateProperties).mockResolvedValue({ success: true });
    renderSystemProperties();

    await user.click(screen.getByText('change-interceptors'));
    await user.click(saveButton());

    expect(updateProperties).toHaveBeenCalledOnce();
    expect(saveEnrichmentRoutes).not.toHaveBeenCalled();
    expect(getEnrichmentRoutes).not.toHaveBeenCalled();
  });
});
