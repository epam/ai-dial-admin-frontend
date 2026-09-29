import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { getEntityPath, getUrnForEntity } from '@/src/utils/open-in-new-tab';

const STORAGE_PATH = 'runner%3Aname';
const DECLARED_ID = 'https://dial.example.com/custom_application_schemas/runner';

describe('App runner asset :: storage path round trip', () => {
  test('builds the same URL from a metadata row and a newly created resource', () => {
    const fromMetadataRow = getUrnForEntity(ApplicationRoute.PlatformAppRunners, {
      $id: DECLARED_ID,
      _metadata: { name: 'runner:name', path: STORAGE_PATH },
    });
    const fromCreatedResource = getUrnForEntity(ApplicationRoute.PlatformAppRunners, { name: STORAGE_PATH });

    expect(fromMetadataRow).toEqual('/platform-app-runners/runner%253Aname');
    expect(fromCreatedResource).toEqual(fromMetadataRow);
  });

  test("survives Next's single path decode back to the Core storage path", () => {
    const segment = getEntityPath(ApplicationRoute.PlatformAppRunners, { path: STORAGE_PATH });

    expect(decodeURIComponent(segment)).toEqual(STORAGE_PATH);
  });

  test('does not derive a resource route from the declared schema id alone', () => {
    expect(getEntityPath(ApplicationRoute.PlatformAppRunners, { $id: DECLARED_ID })).toEqual('');
  });
});
