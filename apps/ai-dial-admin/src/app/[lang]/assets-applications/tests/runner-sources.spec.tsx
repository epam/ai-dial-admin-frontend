import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AppRunnerOption, AppRunnerOrigin } from '@/src/components/SourceField/Application/models';

vi.mock('@/src/app/api/api', () => ({
  applicationRunnersApi: { getApplicationSchemesList: vi.fn() },
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getAllRunners: vi.fn(),
}));

vi.mock('@/src/utils/auth/auth-request', () => ({ getUserToken: vi.fn().mockResolvedValue('token') }));
vi.mock('@/src/utils/env/get-auth-toggle', () => ({ getIsEnableAuthToggle: () => false }));
vi.mock('@/src/components/Assets/Apps/List', () => ({ __esModule: true, default: () => null }));

import { getAllRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import { applicationRunnersApi } from '@/src/app/api/api';
import Page from '../page';

const entityRunner = { $id: 'urn:runner:entity', 'dial:applicationTypeDisplayName': 'Entity Runner' };
const assetRunner = { name: 'http://asdqwe', path: 'http%3A%2F%2Fasdqwe', folderId: '' };

/** `<SaveValidationContextProvider><AppsList runners={…} /></SaveValidationContextProvider>` */
const runnersPassedToList = (tree: any): AppRunnerOption[] => tree.props.children.props.runners;

describe('Assets > Applications :: runner sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('merges both populations into the picker options', async () => {
    vi.mocked(applicationRunnersApi.getApplicationSchemesList).mockResolvedValue([entityRunner] as never);
    vi.mocked(getAllRunners).mockResolvedValue([assetRunner] as never);

    const runners = runnersPassedToList(await Page());

    expect(runners.map((r) => r.origin)).toEqual([AppRunnerOrigin.Entity, AppRunnerOrigin.Asset]);
    expect(runners.map((r) => r.reference)).toEqual(['urn:runner:entity', 'schemas/platform/http%3A%2F%2Fasdqwe']);
  });

  test('degrades to the entity list when the Core read fails, rather than failing the page', async () => {
    vi.mocked(applicationRunnersApi.getApplicationSchemesList).mockResolvedValue([entityRunner] as never);
    vi.mocked(getAllRunners).mockRejectedValue(new Error('Core unavailable'));

    const runners = runnersPassedToList(await Page());

    expect(runners).toHaveLength(1);
    expect(runners[0].origin).toBe(AppRunnerOrigin.Entity);
  });

  test('still offers asset runners when the admin-BE read fails', async () => {
    vi.mocked(applicationRunnersApi.getApplicationSchemesList).mockRejectedValue(new Error('BE unavailable'));
    vi.mocked(getAllRunners).mockResolvedValue([assetRunner] as never);

    const runners = runnersPassedToList(await Page());

    expect(runners).toHaveLength(1);
    expect(runners[0].origin).toBe(AppRunnerOrigin.Asset);
  });
});

/**
 * The runner picker component is shared with `Entities > Applications`, whose reference is a foreign
 * key into the admin BE's own runner table — an asset runner has no row there, so a merged option
 * would be selectable and then fail on save. Asserted against the page sources because the merge
 * happens at the page, where no component test can observe its absence.
 */
const ENTITY_APPLICATION_PAGES = ['applications/page.tsx', 'applications/[id]/page.tsx'];

describe('Entities > Applications :: keeps an entity-only runner source', () => {
  test.each(ENTITY_APPLICATION_PAGES)('%s does not read the Core asset-runner list', (page) => {
    const source = readFileSync(join(__dirname, '../..', page), 'utf-8');

    expect(source).toContain('getApplicationSchemesList');
    expect(source).not.toContain('getAllRunners');
    expect(source).not.toContain('buildAppRunnerOptions');
  });
});
