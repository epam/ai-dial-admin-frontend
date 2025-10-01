import { describe, expect, test } from 'vitest';
import { getFrameConfig, getAppRunner } from '../utils';

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

describe('getAppRunner', () => {
  test('returns scheme matching customAppSchemaId', () => {
    const entity = { customAppSchemaId: 'scheme-123' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching editorUrl when customAppSchemaId does not match', () => {
    const entity = { customAppSchemaId: 'nonexistent-id', editorUrl: 'https://url2' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching applicationTypeSchemaId from DialAssetApp', () => {
    const entity = { applicationTypeSchemaId: 'scheme-789' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-789', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching customAppSchemaId when applicationTypeSchemaId does not match', () => {
    const entity = { applicationTypeSchemaId: 'nonexistent-id', customAppSchemaId: 'scheme-456' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching editorUrl when both applicationTypeSchemaId and customAppSchemaId do not match', () => {
    const entity = {
      applicationTypeSchemaId: 'nonexistent-id',
      customAppSchemaId: 'another-id',
      editorUrl: 'https://url2',
    };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns undefined when no matching scheme is found', () => {
    const entity = { customAppSchemaId: 'unknown-id', editorUrl: 'https://unknown.url' };
    const schemes = [{ $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' }];

    const result = getAppRunner(entity, schemes);
    expect(result).toBeUndefined();
  });

  test('returns entity cast as scheme when applicationSchemes is undefined', () => {
    const entity = {
      $id: 'scheme-789',
      'dial:applicationTypeEditorUrl': 'https://casted-url',
    };

    const result = getAppRunner(entity);
    expect(result).toEqual(entity);
  });

  test('returns scheme matching applicationTypeSchemaId if both applicationTypeSchemaId and customAppSchemaId exist', () => {
    const entity = { applicationTypeSchemaId: 'scheme-123', customAppSchemaId: 'scheme-456' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching applicationTypeSchemaId when customAppSchemaId is invalid', () => {
    const entity = { applicationTypeSchemaId: 'scheme-123', customAppSchemaId: 'invalid-id' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns undefined when no schemes match and applicationSchemes is non-empty', () => {
    const entity = { customAppSchemaId: 'unknown-id' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toBeUndefined();
  });
});
