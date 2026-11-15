import { describe, expect, it } from 'vitest';

import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getAvailableSources,
  getDefaultSource,
  getHeaderCount,
  hasFlatPublic,
  hasPublicSource,
  hasPublicTree,
  parseSourceParam,
} from '../asset-sources';

const TREE_VIEWS = [ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets];

describe('getAvailableSources', () => {
  it('offers all three sources for Applications and Toolsets', () => {
    TREE_VIEWS.forEach((view) => {
      expect(getAvailableSources(view, false)).toEqual([
        AssetSource.Public,
        AssetSource.Platform,
        AssetSource.ConfigFile,
      ]);
    });
  });

  it('offers Platform, Public and config.json, in that order, for Aliases', () => {
    expect(getAvailableSources(ApplicationRoute.AssetsAliases, false)).toEqual([
      AssetSource.Platform,
      AssetSource.Public,
      AssetSource.ConfigFile,
    ]);
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

  it('offers a unit-mode caller on Aliases the Platform source only, since Core serves aliases to admins', () => {
    expect(getAvailableSources(ApplicationRoute.AssetsAliases, true)).toEqual([AssetSource.Platform]);
  });

  it('drops config.json for a unit-mode caller on a platform entity', () => {
    expect(getAvailableSources(ApplicationRoute.PlatformModels, true)).toEqual([AssetSource.Platform]);
  });

  it('never returns an empty list for any view or mode', () => {
    Object.values(ApplicationRoute).forEach((view) => {
      expect(getAvailableSources(view, false).length).toBeGreaterThan(0);
      expect(getAvailableSources(view, true).length).toBeGreaterThan(0);
    });
  });
});

describe('getDefaultSource and the Public source kinds', () => {
  it('defaults to Public where a public tree exists and to Platform elsewhere', () => {
    expect(getDefaultSource(ApplicationRoute.AssetsApplications)).toBe(AssetSource.Public);
    expect(getDefaultSource(ApplicationRoute.PlatformRoutes)).toBe(AssetSource.Platform);
  });

  it('defaults to Platform for Aliases, whose Public source is flat', () => {
    expect(getDefaultSource(ApplicationRoute.AssetsAliases)).toBe(AssetSource.Platform);
  });

  it('tells a public tree from a flat Public source', () => {
    TREE_VIEWS.forEach((view) => {
      expect(hasPublicTree(view)).toBe(true);
      expect(hasFlatPublic(view)).toBe(false);
      expect(hasPublicSource(view)).toBe(true);
    });
    expect(hasPublicTree(ApplicationRoute.AssetsAliases)).toBe(false);
    expect(hasFlatPublic(ApplicationRoute.AssetsAliases)).toBe(true);
    expect(hasPublicSource(ApplicationRoute.AssetsAliases)).toBe(true);
    expect(hasPublicSource(ApplicationRoute.PlatformKeys)).toBe(false);
  });

  it('keeps every other view free of a Public source', () => {
    const withPublic = Object.values(ApplicationRoute).filter(hasPublicSource);

    expect(withPublic.sort()).toEqual([...TREE_VIEWS, ApplicationRoute.AssetsAliases].sort());
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

  it('opens Aliases on Platform without a tab parameter and honours a Public one', () => {
    const aliasSources = getAvailableSources(ApplicationRoute.AssetsAliases, false);

    expect(parseSourceParam(ApplicationRoute.AssetsAliases, undefined, aliasSources)).toBe(AssetSource.Platform);
    expect(parseSourceParam(ApplicationRoute.AssetsAliases, 'public', aliasSources)).toBe(AssetSource.Public);
  });
});

describe('getHeaderCount', () => {
  it('is hidden when the listing has a public tree', () => {
    expect(
      getHeaderCount(
        ApplicationRoute.AssetsApplications,
        [AssetSource.Public, AssetSource.Platform, AssetSource.ConfigFile],
        { [AssetSource.Platform]: 4, [AssetSource.ConfigFile]: 2 },
      ),
    ).toBeUndefined();
  });

  it('sums Platform and config.json', () => {
    expect(
      getHeaderCount(ApplicationRoute.PlatformModels, [AssetSource.Platform, AssetSource.ConfigFile], {
        [AssetSource.Platform]: 5,
        [AssetSource.ConfigFile]: 3,
      }),
    ).toBe(8);
  });

  it('sums all three sources for Aliases, whose Public source is counted', () => {
    expect(
      getHeaderCount(
        ApplicationRoute.AssetsAliases,
        [AssetSource.Platform, AssetSource.Public, AssetSource.ConfigFile],
        { [AssetSource.Platform]: 3, [AssetSource.Public]: 2, [AssetSource.ConfigFile]: 1 },
      ),
    ).toBe(6);
  });

  it('is withheld for Aliases while the Public count has not landed', () => {
    expect(
      getHeaderCount(
        ApplicationRoute.AssetsAliases,
        [AssetSource.Platform, AssetSource.Public, AssetSource.ConfigFile],
        { [AssetSource.Platform]: 3, [AssetSource.ConfigFile]: 1 },
      ),
    ).toBeUndefined();
  });

  it('is the Platform count alone for a single-source listing', () => {
    expect(getHeaderCount(ApplicationRoute.PlatformKeys, [AssetSource.Platform], { [AssetSource.Platform]: 6 })).toBe(
      6,
    );
  });

  it('keeps a real zero', () => {
    expect(getHeaderCount(ApplicationRoute.PlatformKeys, [AssetSource.Platform], { [AssetSource.Platform]: 0 })).toBe(
      0,
    );
  });

  it('is withheld while or when any flat source has no count', () => {
    expect(
      getHeaderCount(ApplicationRoute.PlatformModels, [AssetSource.Platform, AssetSource.ConfigFile], {
        [AssetSource.Platform]: 5,
      }),
    ).toBeUndefined();
  });
});
