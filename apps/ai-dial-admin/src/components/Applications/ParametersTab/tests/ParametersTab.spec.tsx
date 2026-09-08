import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ParametersTab from '../ParametersTab';
import { BasicI18nKey } from '@/src/constants/i18n';
import { AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import { ApplicationSourceType } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn().mockResolvedValue({ success: false }),
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn().mockResolvedValue({ success: true, response: { properties: { propA: {} } } }),
  getRunner: vi.fn().mockResolvedValue({
    success: true,
    response: { $id: 'http://asdqwe/edited', path: 'http%3A%2F%2Fasdqwe' },
  }),
}));

import { getResolvedRunnerSchema, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';

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

    await waitFor(() => expect(getRunner).toHaveBeenCalledWith('http%3A%2F%2Fasdqwe', '*'));
    await waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe/edited'));
  });
});
