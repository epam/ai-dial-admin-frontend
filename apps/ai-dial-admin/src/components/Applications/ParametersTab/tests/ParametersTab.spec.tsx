import { appContextMock } from '@/test-mocks/app-context';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ParametersTab from '../ParametersTab';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { DialApplication } from '@/src/models/dial/application';
import { AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import { ApplicationSourceType } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn().mockResolvedValue({ success: false }),
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn().mockResolvedValue({ success: false }),
  getRunner: vi.fn().mockResolvedValue({
    success: true,
    response: { $id: 'http://asdqwe/edited', path: 'http%3A%2F%2Fasdqwe' },
  }),
}));

vi.mock('@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer', () => ({
  __esModule: true,
  default: ({ data }: { data: Record<string, string> }) => <div>{data.model}</div>,
}));

vi.mock('@/src/components/Applications/ParametersTab/TableView', async () => {
  const { default: StringEditorInput } = await import('@/src/components/Common/StringEditorInput/StringEditorInput');
  return {
    default: ({
      applicationProperties,
      onChangeProperties,
      disabled,
    }: {
      applicationProperties: Record<string, unknown>;
      onChangeProperties: (properties: Record<string, unknown>) => void;
      disabled?: boolean;
    }) => {
      const entries = Object.entries(applicationProperties);
      if (!entries.length) return <div>{BasicI18nKey.NoParameters}</div>;
      return entries.map(([key, value]) => (
        <StringEditorInput
          key={key}
          label={key}
          value={String(value)}
          disabled={disabled}
          onChangeValue={(next) => onChangeProperties({ ...applicationProperties, [key]: next })}
        />
      ));
    },
  };
});

vi.mock('@/src/components/FrameRenderer/FrameRenderer', () => ({
  __esModule: true,
  default: ({ iframeUrl }: { iframeUrl: string }) => <p>{iframeUrl}</p>,
}));

import { getResolvedRunnerSchema, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';

afterEach(() => {
  vi.unstubAllEnvs();
  appContextMock.set({ isReadOnlyAdmin: false });
});

describe('Applications - ApplicationParametersTab', () => {
  test('Should correctly render notification', async () => {
    render(
      <ParametersTab
        application={{ source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'scheme1' } }}
        applicationSchemes={[
          {
            $id: 'scheme1',
            'dial:applicationTypeEditorUrl': 'editor',
            'dial:applicationTypeCompletionEndpoint': 'endpoint',
            'dial:applicationTypeDisplayName': 'name',
            'dial:applicationTypeViewerUrl': 'Viewer Url',
            $schema: 'scheme1',
            properties: {},
          },
          {
            $id: 'scheme2',
            'dial:applicationTypeEditorUrl': 'editor2',
            'dial:applicationTypeCompletionEndpoint': 'endpoint2',
            'dial:applicationTypeDisplayName': 'name2',
            'dial:applicationTypeViewerUrl': 'Viewer Url2',
            $schema: 'scheme2',
            properties: {},
          },
        ]}
      />,
    );

    expect(await screen.findByText(BasicI18nKey.NoParameters)).toBeInTheDocument();
  });

  test('Should correctly render notification when no application schemes', async () => {
    render(<ParametersTab application={{ editorUrl: 'editorUrl' }} />);

    expect(await screen.findByText(BasicI18nKey.NoParameters)).toBeInTheDocument();
  });

  test('renders publication resource configuration from its declared schema', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
    vi.mocked(getResolvedRunnerSchema).mockResolvedValueOnce({
      success: true,
      response: { $id: 'publication-scheme', properties: { model: { type: 'string' } } },
    } as never);

    render(
      <ParametersTab
        application={
          {
            application_type_schema_id: 'publication-scheme',
            application_properties: { model: 'publication-model' },
          } as unknown as DialApplicationResource
        }
        applicationSchemes={[{ $id: 'publication-scheme' }]}
        view={ApplicationRoute.ApplicationPublications}
      />,
    );

    expect(await screen.findByText('publication-model')).toBeInTheDocument();
    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('publication-scheme');
  });

  test('resolves a platform-origin runner via its content $id before rendering', async () => {
    render(
      <ParametersTab
        application={{ source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'http://asdqwe' } }}
        applicationSchemes={[
          {
            $id: 'http://asdqwe',
            origin: AppRunnerOrigin.Platform,
            path: 'http%3A%2F%2Fasdqwe',
          } as never,
        ]}
        view={ApplicationRoute.Applications}
      />,
    );

    await vi.waitFor(() => expect(getRunner).toHaveBeenCalledWith('http%3A%2F%2Fasdqwe', '*'));
    await vi.waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe/edited'));
  });
});

describe('ParametersTab — property maps', () => {
  test.each([
    [ApplicationRoute.Applications, 'applicationProperties'],
    [ApplicationRoute.AssetsApplications, 'application_properties'],
  ])('updates the %s draft using %s', async (view, propertyField) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const application = { name: 'app', [propertyField]: { prompt: 'initial', other: 'untouched' } };
    render(<ParametersTab application={application} view={view} onChange={onChange} />);

    await user.click(await screen.findByRole('button', { name: `${ButtonsI18nKey.Open} prompt` }));
    fireEvent.change(screen.getByRole('textbox', { name: 'prompt' }), {
      target: { value: '  first\nsecond\n' },
    });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...application,
      [propertyField]: { prompt: '  first\nsecond\n', other: 'untouched' },
    });
  });
});

describe('ParametersTab — router', () => {
  const routerUi = 'http://router-ui.test/';
  const schemaUi = 'http://schema-ui.test/';
  const typedRouterSchemes = [{ $id: 'router-type', 'dial:applicationTypeEditorUrl': schemaUi, properties: {} }];

  const renderRouterTab = (
    router: Record<string, unknown>,
    props: { isUiViewForced?: boolean; schemes?: never[] } = {},
  ) =>
    render(
      <ParametersTab
        application={{ name: 'cost-aware', ...router } as DialApplication}
        applicationSchemes={props.schemes ?? []}
        isUiViewForced={props.isUiViewForced}
        view={ApplicationRoute.PlatformRouters}
      />,
    );

  test('opens the UI view with the router editor URL for a router without a schema', async () => {
    renderRouterTab({ editorUrl: routerUi }, { isUiViewForced: true });

    expect(await screen.findByText(new RegExp(`^${routerUi}\\?.*id=cost-aware`))).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Add })).toBeNull();
    expect(screen.queryByText(BasicI18nKey.NoParameters)).toBeNull();
  });

  test('loads the schema editor URL over the router editor URL', async () => {
    renderRouterTab(
      { applicationTypeSchemaId: 'router-type', editorUrl: routerUi },
      { schemes: typedRouterSchemes as never[] },
    );

    expect(await screen.findByText(new RegExp(`^${schemaUi}`))).toBeTruthy();
    expect(screen.queryByText(new RegExp(`^${routerUi}`))).toBeNull();
  });

  test('offers no UI view to a read-only admin', async () => {
    appContextMock.set({ isReadOnlyAdmin: true });
    renderRouterTab(
      { applicationTypeSchemaId: 'router-type', editorUrl: routerUi },
      { schemes: typedRouterSchemes as never[] },
    );

    expect(await screen.findByText(BasicI18nKey.NoParameters)).toBeTruthy();
    expect(screen.queryByText(new RegExp(`^${schemaUi}`))).toBeNull();
  });
});
