import { describe, expect, test, vi } from 'vitest';

import { createModel } from '@/src/app/[lang]/platform-models/actions';
import { createRunner } from '@/src/app/[lang]/platform-app-runners/actions';
import { createCatalogSchema } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { createInterceptor } from '@/src/app/[lang]/platform-interceptors/actions';
import { createTranslator } from '@/src/app/[lang]/platform-translators/actions';
import { createRoute } from '@/src/app/[lang]/platform-routes/actions';
import { createRole } from '@/src/app/[lang]/platform-roles/actions';
import { createKey } from '@/src/app/[lang]/platform-keys/actions';
import { createPolicy } from '@/src/app/[lang]/platform-policies/actions';
import { createPolicyAssignment } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { ApplicationRoute } from '@/src/types/routes';
import { CreateAssetRoute } from '../types';
import { CreateAssetActionMap } from '../utils';

vi.mock('@/src/app/[lang]/platform-models/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-models/actions')>()),
  createModel: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-app-runners/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-app-runners/actions')>()),
  createRunner: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-catalog-schemas/actions')>()),
  createCatalogSchema: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-interceptors/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-interceptors/actions')>()),
  createInterceptor: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-translators/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-translators/actions')>()),
  createTranslator: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-routes/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-routes/actions')>()),
  createRoute: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-roles/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-roles/actions')>()),
  createRole: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-keys/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-keys/actions')>()),
  createKey: vi.fn(),
}));

vi.mock('@/src/app/[lang]/platform-policies/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-policies/actions')>()),
  createPolicy: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-policy-assignments/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-policy-assignments/actions')>()),
  createPolicyAssignment: vi.fn(),
}));

describe('CreateAssetActionMap', () => {
  test.each([
    [ApplicationRoute.PlatformModels, createModel, { name: 'model', endpoint: 'https://models.example.com' }],
    [
      ApplicationRoute.PlatformAppRunners,
      createRunner,
      { $id: 'https://schemas.example.com/runner', 'dial:applicationTypeDisplayName': 'Runner' },
    ],
    [
      ApplicationRoute.PlatformCatalogSchemas,
      createCatalogSchema,
      { $id: 'https://schemas.example.com/catalog', 'dial:catalogDisplayName': 'Catalog' },
    ],
    [ApplicationRoute.PlatformInterceptors, createInterceptor, { name: 'interceptor', displayName: 'Interceptor' }],
    [
      ApplicationRoute.PlatformTranslators,
      createTranslator,
      { name: 'translator', baseUrl: 'https://translator.example.com' },
    ],
    [ApplicationRoute.PlatformRoutes, createRoute, { name: 'route', paths: ['/v1'] }],
    [ApplicationRoute.PlatformRoles, createRole, { name: 'role', costLimit: { minute: 1 } }],
    [ApplicationRoute.PlatformKeys, createKey, { name: 'key', key: 'secret' }],
  ])('removes transient fields before delegating a %s create', async (view, createAction, content) => {
    vi.mocked(createAction).mockResolvedValue({ success: true });

    await CreateAssetActionMap[view as CreateAssetRoute]({
      ...content,
      folderId: 'platform/',
      _metadata: { folderId: 'platform/', path: 'platform/original' },
    } as never);

    expect(createAction).toHaveBeenCalledWith(content);
  });

  // A policy record is stored under its cost object, so, unlike the flat views, the folder must reach the
  // action, which builds the path from it and drops it from the body.
  test.each([
    [ApplicationRoute.PlatformPolicies, createPolicy],
    [ApplicationRoute.PlatformPolicyAssignments, createPolicyAssignment],
  ])('passes the cost object folder through to a %s create', async (view, createAction) => {
    vi.mocked(createAction).mockResolvedValue({ success: true });
    const asset = { name: 'cap', folderId: 'team-a/' };

    await CreateAssetActionMap[view as CreateAssetRoute](asset as never);

    expect(createAction).toHaveBeenCalledWith(asset);
  });
});
