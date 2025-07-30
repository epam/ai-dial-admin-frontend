import { describe, expect, test } from 'vitest';
import { getFrameConfig, getScheme } from '../utils';

describe('getFrameConfig', () => {
  test('returns config for DialApplicationScheme', () => {
    const scheme = {
      'dial:applicationTypeEditorUrl': 'https://editor.url',
      'dial:applicationTypeDisplayName': 'App Name',
    };
    const theme = 'dark';
    const session = { providerId: 'provider-123' };

    const config = getFrameConfig(scheme, theme, session);

    expect(config).toEqual({
      theme: 'dark',
      providerId: 'provider-123',
      host: 'https://editor.url',
      name: 'App Name',
    });
  });

  test('returns config for DialApplicationResource', () => {
    const resource = {
      editorUrl: 'https://resource-editor.url',
      name: 'Resource Name',
    };
    const theme = 'light';

    const config = getFrameConfig(resource, theme);

    expect(config).toEqual({
      theme: 'light',
      providerId: undefined,
      host: 'https://resource-editor.url',
      name: 'Resource Name',
    });
  });

  test('returns undefined for missing host and name', () => {
    const scheme = {};
    const theme = 'dark';

    const config = getFrameConfig(scheme, theme);

    expect(config).toEqual({
      theme: 'dark',
      providerId: undefined,
      host: undefined,
      name: undefined,
    });
  });
});

describe('getScheme', () => {
  test('returns scheme matching customAppSchemaId', () => {
    const entity = { customAppSchemaId: 'scheme-123' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getScheme(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching editorUrl when customAppSchemaId does not match', () => {
    const entity = { customAppSchemaId: 'nonexistent-id', editorUrl: 'https://url2' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getScheme(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns undefined when no matching scheme is found', () => {
    const entity = { customAppSchemaId: 'unknown-id', editorUrl: 'https://unknown.url' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
    ];

    const result = getScheme(entity, schemes);
    expect(result).toBeUndefined();
  });

  test('returns entity cast as scheme when applicationSchemes is undefined', () => {
    const entity = {
      $id: 'scheme-789',
      'dial:applicationTypeEditorUrl': 'https://casted-url',
    };

    const result = getScheme(entity);
    expect(result).toEqual(entity);
  });
});