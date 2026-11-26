import { describe, expect, test } from 'vitest';

import {
  getInitialApplicationAsset,
  isApplicationCreationSourceValid,
} from '@/src/components/Assets/Entities/Apps/utils';
import { ASSET_APPLICATION_INTERFACES_SOURCE_TYPE } from '@/src/components/SourceField/constants';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { CODE_APP_SOURCE_TYPE } from '@/src/utils/entities/application-source';

describe('getInitialApplicationAsset', () => {
  test('initializes a public asset with a version and permits seeded values', () => {
    expect(getInitialApplicationAsset('public/folder/', false, { name: 'seeded' })).toEqual({
      name: 'seeded',
      displayName: '',
      description: '',
      interfaces: {},
      folderId: 'public/folder/',
      version: DEFAULT_NEW_ENTITY_VERSION,
    });
  });

  test('initializes a platform asset without a version', () => {
    expect(getInitialApplicationAsset('platform/', true)).toEqual({
      name: '',
      displayName: '',
      description: '',
      interfaces: {},
      folderId: 'platform/',
      user_roles: [],
    });
  });
});

describe('isApplicationCreationSourceValid', () => {
  const asset = getInitialApplicationAsset('public/', false);

  test.each([
    ['chat only', 'https://example.com/chat', undefined, true],
    ['MCP only', undefined, 'https://example.com/mcp', true],
    ['both', 'https://example.com/chat', 'https://example.com/mcp', true],
    ['neither', undefined, undefined, false],
    ['empty', '', '', false],
    ['invalid', 'bad-url', 'also-bad', false],
    ['valid MCP with invalid chat', 'bad-url', 'https://example.com/mcp', true],
    ['valid chat with invalid MCP', 'https://example.com/chat', 'bad-url', true],
  ])('evaluates %s endpoint source', (_description, endpoint, mcpEndpoint, isExpected) => {
    expect(
      isApplicationCreationSourceValid(
        { ...asset, endpoint, mcp: mcpEndpoint == null ? undefined : { endpoint: mcpEndpoint } },
        SOURCE_TYPE.ENDPOINTS,
      ),
    ).toBe(isExpected);
  });

  test('requires an interface in Interfaces mode', () => {
    expect(isApplicationCreationSourceValid(asset, ASSET_APPLICATION_INTERFACES_SOURCE_TYPE)).toBe(false);
    expect(
      isApplicationCreationSourceValid(
        { ...asset, interfaces: { chat: { base_url: 'https://example.com' } } },
        ASSET_APPLICATION_INTERFACES_SOURCE_TYPE,
      ),
    ).toBe(true);
  });

  test('requires a selected runner in Schema mode', () => {
    expect(isApplicationCreationSourceValid(asset, SOURCE_TYPE.SCHEMA)).toBe(false);
    expect(
      isApplicationCreationSourceValid({ ...asset, application_type_schema_id: 'runner' }, SOURCE_TYPE.SCHEMA),
    ).toBe(true);
  });

  test('requires the editor URL in Code App mode and rejects unknown modes', () => {
    expect(isApplicationCreationSourceValid(asset, CODE_APP_SOURCE_TYPE)).toBe(false);
    expect(isApplicationCreationSourceValid(asset, CODE_APP_SOURCE_TYPE, 'https://example.com/editor')).toBe(true);
    expect(isApplicationCreationSourceValid(asset, 'unknown')).toBe(false);
  });
});
