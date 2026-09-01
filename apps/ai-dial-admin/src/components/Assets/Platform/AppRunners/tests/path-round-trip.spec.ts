import { describe, expect, test } from 'vitest';

import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { parseEncodedFlatPath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { fromCoreRunnerName, toCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { getEntityPath, getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { ApplicationRoute } from '@/src/types/routes';

const RUNNER_ID = 'http://asdqwe';
const PREFIX = RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA];

/**
 * Grid rows carry the *decoded* `$id` as `name` (`toResourceInfo` applies `fromCoreRunnerName`), and
 * `getEntityPath` applies exactly one `encodeURIComponent` regardless of whether it read `name` or
 * fell back to `$id`. That single encode/decode pair is what row-click and post-duplicate-redirect
 * navigation must agree on — a pre-encode on either side is what produced the #4349 404.
 */
describe('App runner asset :: $id path round trip', () => {
  const coreName = toCoreRunnerName(RUNNER_ID);
  const coreMetadataUrl = `${PREFIX}${encodeURIComponent(coreName)}`;

  test('Should store the id as one singly-encoded resource name', () => {
    expect(coreName).toEqual('http%3A%2F%2Fasdqwe');
    expect(coreName).not.toContain('/');
  });

  test('Should recover the raw $id from the metadata url', () => {
    const { name } = parseEncodedFlatPath(coreMetadataUrl, PREFIX);

    expect(fromCoreRunnerName(name)).toEqual(RUNNER_ID);
  });

  test('Row-click and post-duplicate-redirect build the identical URL segment', () => {
    // Row click: navigates from the grid row's decoded `name`.
    const fromRowClick = getUrnForEntity(ApplicationRoute.PlatformAppRunners, { name: RUNNER_ID });
    // Post-duplicate redirect: no `name` yet, falls back to the freshly authored `$id`.
    const fromRedirect = getUrnForEntity(ApplicationRoute.PlatformAppRunners, { $id: RUNNER_ID });

    expect(fromRedirect).toEqual(fromRowClick);
  });

  test("Should survive Next's single path decode back to the raw $id", () => {
    const segment = getEntityPath(ApplicationRoute.PlatformAppRunners, { $id: RUNNER_ID }, false);

    // Next.js decodes the [id] segment once — params.id must be the raw $id, matching what a
    // fresh page load for this same runner (read via `name`) would also produce.
    expect(decodeURIComponent(segment)).toEqual(RUNNER_ID);
  });
});
