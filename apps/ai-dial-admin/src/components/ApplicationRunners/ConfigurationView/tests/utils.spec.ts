import { clearSchemeForEditor } from '../utils';
import { describe, expect, test } from 'vitest';
import { TypeBucketCopy } from '@/src/models/dial/application';

describe('ApplicationRunner :: clearSchemeForEditor', () => {
  test('Should clear all field', () => {
    const res = clearSchemeForEditor({
      $id: '$id',
      $schema: '$schema',
      description: '',
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
      ['dial:applicationTypeAssistantAttachmentsInRequestSupported']: false,
      ['dial:applicationTypeRoutes']: [],
      ['dial:applicationTypeBucketCopy']: TypeBucketCopy.ENABLED,
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
