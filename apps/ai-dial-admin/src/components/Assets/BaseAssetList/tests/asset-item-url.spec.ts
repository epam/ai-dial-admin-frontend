import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { getAssetItemHref, getAssetItemUrl } from '../asset-item-url';

const PROMPT = { name: 'summarize__1.0', path: 'public/team/summarize__1.0', folderId: 'public/team/' };

describe('getAssetItemUrl', () => {
  test('builds the details address of an item', () => {
    expect(getAssetItemUrl(ApplicationRoute.Prompts, PROMPT, 'public/team/')).toMatch(/^\/prompts\//);
  });

  test('marks an item opened from the file root as config-file sourced', () => {
    expect(getAssetItemUrl(ApplicationRoute.Prompts, PROMPT, 'file/')).toMatch(/[?&]configFile=true$/);
  });

  test('leaves a Catalog Schema opened from the file root unmarked', () => {
    const schema = { name: 'schema-1', path: 'file/schema-1' };

    expect(getAssetItemUrl(ApplicationRoute.PlatformCatalogSchemas, schema, 'file/')).not.toContain('configFile');
  });
});

describe('getAssetItemHref', () => {
  test('returns the details address for an openable item', () => {
    expect(getAssetItemHref(ApplicationRoute.Prompts, PROMPT, 'public/team/')).toBe(
      getAssetItemUrl(ApplicationRoute.Prompts, PROMPT, 'public/team/'),
    );
  });

  test('returns nothing for an item whose name cannot be opened', () => {
    expect(getAssetItemHref(ApplicationRoute.Prompts, { name: 'bad:name/x' }, 'public/')).toBeUndefined();
  });

  test('returns nothing without an item or a name', () => {
    expect(getAssetItemHref(ApplicationRoute.Prompts, undefined)).toBeUndefined();
    expect(getAssetItemHref(ApplicationRoute.Prompts, {})).toBeUndefined();
  });
});
