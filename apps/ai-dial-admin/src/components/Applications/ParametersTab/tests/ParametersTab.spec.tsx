import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ParametersTab from '../ParametersTab';
import { BasicI18nKey } from '@/src/constants/i18n';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => {
    return { session: { providerId: 'provider' } };
  }),
}));

describe('Applications - ApplicationParametersTab', () => {
  test('Should correctly render notification', () => {
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

    expect(screen.getByText(BasicI18nKey.NoParameters)).toBeInTheDocument();
  });

  test('Should correctly render notification', () => {
    render(<ParametersTab application={{ editorUrl: 'editorUrl' }} />);

    expect(screen.getByText(BasicI18nKey.NoParameters)).toBeInTheDocument();
  });
});
