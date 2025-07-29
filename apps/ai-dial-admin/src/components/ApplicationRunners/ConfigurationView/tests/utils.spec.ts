import { clearSchemeForEditor, getErrorForAppRunnerId } from '../utils';
import { ErrorType } from '@/src/types/error-type';
import { describe, expect, test } from 'vitest';

describe('ApplicationRunner :: clearSchemeForEditor', () => {
  test('Should clear all field', () => {
    const res = clearSchemeForEditor({
      $id: '$id',
      $schema: '$schema',
      description: 'description',
      applications: ['app1', 'app2'],
      topics: ['topic1', 'topic2'],
      ['dial:applicationTypeCompletionEndpoint']: 'dial:applicationTypeCompletionEndpoint',
      ['dial:applicationTypeViewerUrl']: 'dial:applicationTypeViewerUrl',
      ['dial:applicationTypeEditorUrl']: 'dial:applicationTypeEditorUrl',
      ['dial:applicationTypeConfigurationEndpoint']: 'dial:applicationTypeConfigurationEndpoint',
      ['dial:applicationTypeTokenizeEndpoint']: 'dial:applicationTypeTokenizeEndpoint',
      ['dial:applicationTypeRateEndpoint']: 'dial:applicationTypeRateEndpoint',
      ['dial:applicationTypeTruncatePromptEndpoint']: 'dial:applicationTypeTruncatePromptEndpoint',
      ['dial:appendApplicationPropertiesHeader']: true,
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

describe('ApplicationRunner :: getErrorForAppRunnerId', () => {
  test('Should clear all field', () => {
    const res = getErrorForAppRunnerId('id');

    expect(res).toEqual({
      text: '',
      type: ErrorType.INVALID,
    });
  });

  test('Should clear all field', () => {
    const res = getErrorForAppRunnerId(`https://ai-dial-test.projects.com${new Array(851).fill('a').join()}`);

    expect(res).toEqual({
      text: '',
      type: ErrorType.LENGTH,
    });
  });

  test('Should clear all field', () => {
    const res = getErrorForAppRunnerId('https://ai-dial-test.projects.com');

    expect(res).toBeNull();
  });
});
