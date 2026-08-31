import { describe, expect, test } from 'vitest';

import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { validateAppRunner } from '@/src/utils/app-runners/validation';
import { getEntityPath } from '@/src/utils/open-in-new-tab';

const VIEW = ApplicationRoute.PlatformAppRunners;
const RUNNER_ID = 'http://asdqwe';
const ENCODED = 'http%3A%2F%2Fasdqwe';

const runner = (fields: Partial<DialAppRunnerResource>) =>
  ({ $id: RUNNER_ID, 'dial:applicationTypeDisplayName': 'Runner', ...fields }) as DialAppRunnerResource;

/**
 * The raw JSON editor forces the save button enabled, so `validateAppRunner` is the only gate while it
 * is open. A thrown TypeError there is worse than a validation error: the click handler dies, nothing is
 * shown, and the button just looks dead.
 */
describe('App runner asset :: validation survives arbitrary JSON', () => {
  test('Should reject Core’s name-keyed route object instead of throwing on it', () => {
    const routes = {
      my_route: { 'dial:paths': ['/a'] },
    } as unknown as DialAppRunnerResource['dial:applicationTypeRoutes'];

    expect(() => validateAppRunner(runner({ 'dial:applicationTypeRoutes': routes }))).not.toThrow();
    expect(validateAppRunner(runner({ 'dial:applicationTypeRoutes': routes }))).toContainEqual({
      field: 'dial:applicationTypeRoutes',
      message: 'Routes must be a list; the name-keyed object form Core stores is not accepted here',
    });
  });

  test('Should reject a non-string id instead of throwing on it', () => {
    const bad = runner({ $id: 123 as unknown as string });

    expect(() => validateAppRunner(bad)).not.toThrow();
    expect(validateAppRunner(bad)).toContainEqual({ field: '$id', message: 'Id must be a string' });
  });

  test.each([
    ['methods as a string', { name: 'r', paths: ['/a'], methods: 'GET' }],
    ['paths as a string', { name: 'r', paths: '/a', methods: ['GET'] }],
    ['upstreams as an object', { name: 'r', paths: ['/a'], methods: ['GET'], upstreams: { endpoint: 'x' } }],
    ['a null route', null],
  ])('Should reject %s instead of throwing on it', (_label, route) => {
    const bad = runner({
      'dial:applicationTypeRoutes': [route] as unknown as DialAppRunnerResource['dial:applicationTypeRoutes'],
    });

    expect(() => validateAppRunner(bad)).not.toThrow();
    expect(validateAppRunner(bad).length).toBeGreaterThan(0);
  });

  test('Should not accept a numeric route name via implicit stringification', () => {
    const bad = runner({
      'dial:applicationTypeRoutes': [
        { name: 123, paths: ['/a'], methods: ['GET'], upstreams: [{ endpoint: 'x' }] },
      ] as unknown as DialAppRunnerResource['dial:applicationTypeRoutes'],
    });

    expect(() => validateAppRunner(bad)).not.toThrow();
  });
});

/**
 * Straight after create there is no listing row, so the only identity available is the `$id` the form
 * collected — `name` is deliberately never set for this type.
 */
describe('App runner asset :: post-create navigation', () => {
  test('Should build a detail path from $id alone', () => {
    const path = getEntityPath(VIEW, { $id: RUNNER_ID } as never, false);

    expect(path).toEqual(`${encodeURIComponent(RUNNER_ID)}?path=${encodeURIComponent(ENCODED)}`);
    expect(path).not.toEqual('?path=');
  });

  test('Should prefer an existing listing row path over deriving one', () => {
    const path = getEntityPath(VIEW, { name: RUNNER_ID, path: ENCODED } as never, false);

    expect(path).toEqual(`${encodeURIComponent(RUNNER_ID)}?path=${encodeURIComponent(ENCODED)}`);
  });

  test('Should agree with the row-click path, so both entry points reach the same resource', () => {
    expect(getEntityPath(VIEW, { $id: RUNNER_ID } as never, false)).toEqual(
      getEntityPath(VIEW, { name: RUNNER_ID, path: ENCODED } as never, false),
    );
  });
});

describe('App runner asset :: labels', () => {
  test('Should not reuse the Builders menu label', () => {
    const assets = MENU_CONFIGURATION(16, {} as never).find((group) => group.key === MenuI18nKey.Assets);
    const builders = MENU_CONFIGURATION(16, {} as never).find((group) => group.key === MenuI18nKey.Builders);

    const assetKey = assets?.items?.find((item) => item.href === VIEW)?.key;
    const builderKey = builders?.items?.find((item) => item.href === ApplicationRoute.ApplicationRunners)?.key;

    expect(assetKey).toEqual(MenuI18nKey.PlatformAppRunners);
    expect(assetKey).not.toEqual(builderKey);
  });
});

describe('App runner asset :: grid column identity', () => {
  test('Should give every column a distinct colId', () => {
    const resolved = getGridColumns(VIEW, () => void 0, {}, false).map((column: unknown) =>
      typeof column === 'function'
        ? (column as (l: Intl.LocalesArgument, o?: Intl.DateTimeFormatOptions) => { colId?: string })('en-US', void 0)
            .colId
        : (column as { colId?: string }).colId,
    );

    expect(new Set(resolved).size).toEqual(resolved.length);
  });
});
