import { describe, expect, test } from 'vitest';

import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { encodeCorePath, parseEncodedFlatPath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { fromCoreRunnerName, toCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { ApplicationRoute } from '@/src/types/routes';

const RUNNER_ID = 'http://asdqwe';
const PREFIX = RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA];

/**
 * The `$id` crosses four encode/decode boundaries between the grid and Core, and every one of them
 * has to agree: Core's metadata url, the row's `path`, the detail-page [id] segment (which Next
 * decodes once on its own), and `encodeCorePath` on the way back out. One decode too many turns the
 * id's `://` into path separators and the read 404s.
 */
describe('App runner asset :: $id path round trip', () => {
  const coreName = toCoreRunnerName(RUNNER_ID);
  const coreMetadataUrl = `${PREFIX}${encodeURIComponent(coreName)}`;

  test('Should store the id as one singly-encoded resource name', () => {
    expect(coreName).toEqual('http%3A%2F%2Fasdqwe');
    expect(coreName).not.toContain('/');
  });

  test('Should keep the row path singly encoded while showing the decoded id', () => {
    const { path, name } = parseEncodedFlatPath(coreMetadataUrl, PREFIX);

    expect(path).toEqual(coreName);
    expect(fromCoreRunnerName(name)).toEqual(RUNNER_ID);
  });

  test("Should survive the detail-page url and Next's single path decode", () => {
    const { path } = parseEncodedFlatPath(coreMetadataUrl, PREFIX);
    // Listing rows carry name = Core name (path), not the raw $id URL.
    const urn = getUrnForEntity(ApplicationRoute.PlatformAppRunners, { name: path, path });

    const segment = urn.split('/').at(-1)!;
    // Next.js decodes the [id] segment once — params.id must be the Core name, not the raw URL.
    expect(decodeURIComponent(segment)).toEqual(coreName);
  });

  test('Should rebuild the exact Core request path from the URL path segment', () => {
    const { path } = parseEncodedFlatPath(coreMetadataUrl, PREFIX);
    const urn = getUrnForEntity(ApplicationRoute.PlatformAppRunners, { name: path, path });
    // params.id = Core name after Next.js decodes the [id] segment once.
    const paramId = decodeURIComponent(urn.split('/').at(-1)!);

    expect(paramId).toEqual(coreName);
    // Read path: getRunner(params.id) → encodeCorePath(params.id) — no toCoreRunnerName involved.
    expect(encodeCorePath(paramId)).toEqual('http%253A%252F%252Fasdqwe');
  });

  test('Should break if the page decodes the query param a second time', () => {
    const overDecoded = decodeURIComponent(coreName);

    expect(overDecoded).toEqual(RUNNER_ID);
    expect(encodeCorePath(overDecoded)).toContain('/');
    expect(encodeCorePath(overDecoded)).not.toEqual('http%253A%252F%252Fasdqwe');
  });
});
