import { clearSchemeForEditor, getErrorForAppRunnerId } from '../utils';
import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
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
      ['dial:applicationTypeTokenizeEndpoint']: 'dial:onTypeTokenizeEndpoint',
      ['dial:applicationTypeRateEndpoint']: 'dial:applicationTypeRateEndpoint',
      ['dial:applicationTypeTruncatePromptEndpoint']: 'dial:applicationTypeTruncatePromptEndpoint',
      ['dial:appendApplicationPropertiesHeader']: true,
      ['dial:applicationTypePlaybackSupport']: true,
      ['dial:applicationTypeRoutes']: [],
      ['dial:applicationTypeIconUrl']: 'icon1.svg',
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
  const t = (s: string) => s;
  test('Should clear all field', () => {
    const res1 = getErrorForAppRunnerId('id');
    const res2 = getErrorForAppRunnerId('id', t);

    expect(res1).toEqual({
      text: '',
      type: ErrorType.INVALID,
    });

    expect(res2).toEqual({
      text: ErrorI18nKey.UrlField,
      type: ErrorType.INVALID,
    });
  });

  test('Should clear all field', () => {
    const res1 = getErrorForAppRunnerId(`https://ai-dial-test.projects.com${new Array(851).fill('a').join()}`);
    const res2 = getErrorForAppRunnerId(`https://ai-dial-test.projects.com${new Array(851).fill('a').join()}`, t);

    expect(res1).toEqual({
      text: '',
      type: ErrorType.LENGTH,
    });
    expect(res2).toEqual({
      text: ErrorI18nKey.Length,
      type: ErrorType.LENGTH,
    });
  });

  test('Should clear all field', () => {
    const res = getErrorForAppRunnerId('https://ai-dial-test.projects.com');

    expect(res).toBeNull();
  });
});
