import { render } from '@testing-library/react';
import ApplicationParametersTab from '../ApplicationParametersTab';
import { describe, expect, test, vi } from 'vitest';

describe('Applications - ApplicationParametersTab', () => {
  test('Should correctly render notification', () => {
    const { baseElement, getByTestId } = render(
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
