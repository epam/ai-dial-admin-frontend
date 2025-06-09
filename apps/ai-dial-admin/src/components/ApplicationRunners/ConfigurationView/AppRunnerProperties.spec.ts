import { clearSchemeForEditor } from './AppRunnerProperties.utils';

describe('ApplicationRunner :: clearSchemeForEditor', () => {
  it('Should clear all field', () => {
    const res = clearSchemeForEditor({
      $id: '$id',
      $schema: '$schema',
      description: 'description',
      ['dial:applicationTypeCompletionEndpoint']: 'dial:applicationTypeCompletionEndpoint',
      ['dial:applicationTypeViewerUrl']: 'dial:applicationTypeViewerUrl',
      ['dial:applicationTypeEditorUrl']: 'dial:applicationTypeEditorUrl',
      ['dial:applicationTypeDisplayName']: 'dial:applicationTypeDisplayName',
      properties: {
        properties1: '1',
        properties2: '2',
      },
    });

    expect(res).toEqual({
      properties: {
        properties1: '1',
        properties2: '2',
      },
    });
  });
});
