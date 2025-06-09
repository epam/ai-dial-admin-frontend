import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import ApplicationParametersTab from '../ApplicationParametersTab';

jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { username: 'admin' },
    providerId: 'provider',
  };
  return {
    ...originalModule,
    useSession: jest.fn(() => {
      return { data: mockSession, status: 'authenticated' };
    }),
  };
});

describe('Applications - ApplicationParametersTab', () => {
  it('Should correctly render notification', () => {
    const { baseElement, getByTestId } = renderWithContext(
      <ApplicationParametersTab
        entity={{ customAppSchemaId: 'scheme1' }}
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

    const progress = getByTestId('scheme1');

    expect(baseElement).toBeTruthy();
    expect(progress).toBeTruthy();
  });
});
