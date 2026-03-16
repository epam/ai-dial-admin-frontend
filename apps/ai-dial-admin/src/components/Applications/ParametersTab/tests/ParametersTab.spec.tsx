import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ParametersTab from '../ParametersTab';
import { BasicI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn().mockResolvedValue({ success: false }),
}));

describe('Applications - ApplicationParametersTab', () => {
  test('Should correctly render notification', async () => {
    render(
      <ParametersTab
        application={{ customAppSchemaId: 'scheme1' }}
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
});
