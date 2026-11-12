import { describe, expect, it } from 'vitest';

import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getAvailableSources,
  getDefaultSource,
  getHeaderCount,
  hasPublicSource,
  parseSourceParam,
} from '../asset-sources';

describe('getAvailableSources', () => {
  it('offers all three sources for Applications and Toolsets', () => {
    [ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets].forEach((view) => {
      expect(getAvailableSources(view, false)).toEqual([
        AssetSource.Public,
        AssetSource.Platform,
        AssetSource.ConfigFile,
      ]);
    });
  });

  it('offers Platform and config.json for a platform entity with a config-file type', () => {
    expect(getAvailableSources(ApplicationRoute.PlatformModels, false)).toEqual([
      AssetSource.Platform,
      AssetSource.ConfigFile,
    ]);
  });

  it.each([
    ApplicationRoute.PlatformKeys,
    ApplicationRoute.PlatformPolicies,
    ApplicationRoute.PlatformPolicyAssignments,
  ])('offers Platform only for %s, which has no config-file type', (view) => {
    expect(getAvailableSources(view, false)).toEqual([AssetSource.Platform]);
  });

  it('offers Public only to a unit-mode caller on Applications and Toolsets', () => {
    expect(getAvailableSources(ApplicationRoute.AssetsApplications, true)).toEqual([AssetSource.Public]);
    expect(getAvailableSources(ApplicationRoute.AssetsToolsets, true)).toEqual([AssetSource.Public]);
  });

  it('drops config.json for a unit-mode caller on a platform entity', () => {
    expect(getAvailableSources(ApplicationRoute.PlatformModels, true)).toEqual([AssetSource.Platform]);
  });
});

describe('getDefaultSource and hasPublicSource', () => {
  it('defaults to Public where a public tree exists and to Platform elsewhere', () => {
    expect(getDefaultSource(ApplicationRoute.AssetsApplications)).toBe(AssetSource.Public);
    expect(getDefaultSource(ApplicationRoute.PlatformRoutes)).toBe(AssetSource.Platform);
    expect(hasPublicSource(ApplicationRoute.AssetsToolsets)).toBe(true);
    expect(hasPublicSource(ApplicationRoute.PlatformKeys)).toBe(false);
  });
});

describe('parseSourceParam', () => {
  const sources = [AssetSource.Public, AssetSource.Platform, AssetSource.ConfigFile];

  it('returns an available requested source', () => {
    expect(parseSourceParam(ApplicationRoute.AssetsApplications, 'config', sources)).toBe(AssetSource.ConfigFile);
  });

  it('falls back to the default for an unknown, missing or unavailable value', () => {
    expect(parseSourceParam(ApplicationRoute.AssetsApplications, 'nope', sources)).toBe(AssetSource.Public);
    expect(parseSourceParam(ApplicationRoute.AssetsApplications, null, sources)).toBe(AssetSource.Public);
    expect(parseSourceParam(ApplicationRoute.PlatformKeys, 'config', [AssetSource.Platform])).toBe(
      AssetSource.Platform,
    );
  });

  it('falls back to the first source when the default is not offered', () => {
    expect(parseSourceParam(ApplicationRoute.AssetsApplications, undefined, [AssetSource.Platform])).toBe(
      AssetSource.Platform,
    );
  });
});

describe('getHeaderCount', () => {
  it('is hidden when the listing has a Public source', () => {
    expect(
      getHeaderCount([AssetSource.Public, AssetSource.Platform, AssetSource.ConfigFile], {
        [AssetSource.Platform]: 4,
        [AssetSource.ConfigFile]: 2,
      }),
    ).toBeUndefined();
  });

  it('sums Platform and config.json', () => {
    expect(
      getHeaderCount([AssetSource.Platform, AssetSource.ConfigFile], {
        [AssetSource.Platform]: 5,
        [AssetSource.ConfigFile]: 3,
      }),
    ).toBe(8);
  });

  it('is the Platform count alone for a single-source listing', () => {
    expect(getHeaderCount([AssetSource.Platform], { [AssetSource.Platform]: 6 })).toBe(6);
  });

  it('keeps a real zero', () => {
    expect(getHeaderCount([AssetSource.Platform], { [AssetSource.Platform]: 0 })).toBe(0);
  });

  it('is withheld while or when any flat source has no count', () => {
    expect(
      getHeaderCount([AssetSource.Platform, AssetSource.ConfigFile], { [AssetSource.Platform]: 5 }),
    ).toBeUndefined();
  });
});
