import { clearSchemeForEditor } from './AppRunnerProperties.utils';
import { describe, expect, test } from 'vitest';

describe('ApplicationRunner :: clearSchemeForEditor', () => {
  test('Should clear all field', () => {
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
