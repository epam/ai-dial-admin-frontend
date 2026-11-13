import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { getAssetItemHref, getAssetItemUrl } from '../asset-item-url';

const PROMPT = { name: 'summarize__1.0', path: 'public/team/summarize__1.0', folderId: 'public/team/' };

describe('getAssetItemUrl', () => {
  test('builds the details address of an item', () => {
    expect(getAssetItemUrl(ApplicationRoute.Prompts, PROMPT)).toMatch(/^\/prompts\//);
  });

  test('never marks an item as config-file sourced: those rows live in the flat grid', () => {
    expect(getAssetItemUrl(ApplicationRoute.Prompts, PROMPT)).not.toContain('configFile');
  });
});

describe('getAssetItemHref', () => {
  test('returns the details address for an openable item', () => {
    expect(getAssetItemHref(ApplicationRoute.Prompts, PROMPT)).toBe(getAssetItemUrl(ApplicationRoute.Prompts, PROMPT));
  });

  test('returns nothing for an item whose name cannot be opened', () => {
    expect(getAssetItemHref(ApplicationRoute.Prompts, { name: 'bad:name/x' })).toBeUndefined();
  });

  test('returns nothing without an item or a name', () => {
    expect(getAssetItemHref(ApplicationRoute.Prompts, undefined)).toBeUndefined();
    expect(getAssetItemHref(ApplicationRoute.Prompts, {})).toBeUndefined();
  });
});
