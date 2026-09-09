import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  activityAuditApi,
  analyticsAuditApi,
  containersApi,
  deploymentAuditApi,
  globalFirewallApi,
  imagesApi,
} from '@/src/app/api/api';
import { DialActivity } from '@/src/models/activity-audit';
import { AuditPageData } from '@/src/models/request';
import { errorObjLog } from '@/src/server/logger';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';
import { getActivityAuditDetailData } from '@/src/utils/audit/get-activity-audit-detail-data';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api');
vi.mock('@/src/server/logger', () => ({
  errorObjLog: vi.fn(),
  errorLog: vi.fn(),
  warnLog: vi.fn(),
  infoLog: vi.fn(),
}));

const SORT_BY_TIME_DESC = [{ column: 'epochTimestampMs', direction: SortDirectionDto.DESC }];

const EMPTY_PAGE: AuditPageData<DialActivity> = { total: 0, totalPages: 0, data: [] };

const ADMIN_ACTIVITY: DialActivity = {
  activityId: 'activity-admin',
  activityType: ActivityAuditType.Update,
  resourceType: ActivityAuditResourceType.MODEL,
  resourceId: 'gpt-4',
  epochTimestampMs: 1_700_000_000_000,
  initiatedAuthor: 'Author',
  initiatedEmail: 'author@epam.com',
  revision: 5,
};

const DEPLOYMENT_ACTIVITY: DialActivity = {
  ...ADMIN_ACTIVITY,
  activityId: 'activity-deployment',
  resourceType: ActivityAuditResourceType.MCP_DEPLOYMENT,
  resourceId: 'mcp-runner',
  revision: 3,
};

const IMAGE_ACTIVITY: DialActivity = {
  ...ADMIN_ACTIVITY,
  activityId: 'activity-image',
  resourceType: ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  resourceId: 'mcp-image',
  revision: 2,
};

const FIREWALL_ACTIVITY: DialActivity = {
  ...ADMIN_ACTIVITY,
  activityId: 'activity-firewall',
  resourceType: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
  resourceId: 'global-whitelist',
  revision: 4,
};

const ANALYTICS_ACTIVITY: DialActivity = {
  ...ADMIN_ACTIVITY,
  activityId: 'activity-analytics',
  resourceType: ActivityAuditResourceType.TABLE_COLUMN,
  resourceId: 'orders:total',
  revision: 7,
};

const pageOf = (activities: DialActivity[]): AuditPageData<DialActivity> => ({
  total: activities.length,
  totalPages: 1,
  data: activities,
});

/** A promise the test resolves by hand, so a call can be observed while it is still in flight. */
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

/** Lets every already-issued request settle, so a still-pending one is a real finding. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const resolveAdminActivity = (activity: DialActivity = ADMIN_ACTIVITY) =>
  vi.mocked(activityAuditApi.getActivityById).mockResolvedValue({ success: true, response: activity });

const missAdminActivity = () =>
  vi.mocked(activityAuditApi.getActivityById).mockResolvedValue({ success: false, response: void 0 });

const missDeploymentActivity = () =>
  vi.mocked(deploymentAuditApi.getActivityById).mockResolvedValue({ success: false, response: void 0 });

const resolveDeploymentActivity = (activity: DialActivity) =>
  vi.mocked(deploymentAuditApi.getActivityById).mockResolvedValue({ success: true, response: activity });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(activityAuditApi.getActivitiesList).mockResolvedValue(EMPTY_PAGE);
  vi.mocked(deploymentAuditApi.getActivitiesList).mockResolvedValue(EMPTY_PAGE);
  vi.mocked(analyticsAuditApi.getActivitiesList).mockResolvedValue(EMPTY_PAGE);
  vi.mocked(activityAuditApi.getRevisionDetails).mockResolvedValue(null);
  vi.mocked(containersApi.getRevisionDetails).mockResolvedValue(null);
  vi.mocked(imagesApi.getRevisionDetails).mockResolvedValue(null);
  vi.mocked(globalFirewallApi.getRevisionDetails).mockResolvedValue(null);
  vi.mocked(analyticsAuditApi.getRevisionDetails).mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getActivityAuditDetailData :: admin activities', () => {
  test('Should resolve an admin activity without issuing the deployment or the analytics lookup', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    resolveAdminActivity();
    vi.mocked(activityAuditApi.getActivitiesList).mockResolvedValue(pageOf([{ ...ADMIN_ACTIVITY, revision: 9 }]));
    vi.mocked(activityAuditApi.getRevisionDetails).mockResolvedValue({ name: 'gpt-4' });

    const result = await getActivityAuditDetailData('activity-admin', TOKEN_MOCK);

    expect(result.activity).toEqual(ADMIN_ACTIVITY);
    expect(deploymentAuditApi.getActivityById).not.toHaveBeenCalled();
    expect(analyticsAuditApi.getActivityById).not.toHaveBeenCalled();
    expect(analyticsAuditApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(activityAuditApi.getActivitiesList).toHaveBeenCalledWith(1, 0, TOKEN_MOCK, SORT_BY_TIME_DESC, [
      { column: 'resourceId', value: 'gpt-4', operator: FilterOperatorDto.EQUALS },
    ]);
    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith('/models/gpt-4/revision/5', TOKEN_MOCK);
    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith('/models/gpt-4/revision/4', TOKEN_MOCK);
    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith('/models/gpt-4/revision/9', TOKEN_MOCK);
  });

  test('Should issue the activities list and both revision snapshots concurrently', async () => {
    resolveAdminActivity();
    const pendingList = deferred<AuditPageData<DialActivity> | null>();
    vi.mocked(activityAuditApi.getActivitiesList).mockReturnValue(pendingList.promise);

    const pending = getActivityAuditDetailData('activity-admin', TOKEN_MOCK);
    await tick();

    // Both snapshots are in flight while the list request has not settled: serializing the chain
    // would leave these at 0 until the list resolved.
    expect(activityAuditApi.getActivitiesList).toHaveBeenCalledOnce();
    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledTimes(2);

    pendingList.resolve(EMPTY_PAGE);
    await pending;

    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledTimes(2);
  });

  test('Should request no snapshot before the first revision of a resource', async () => {
    resolveAdminActivity({ ...ADMIN_ACTIVITY, revision: 0 });

    const result = await getActivityAuditDetailData('activity-admin', TOKEN_MOCK);

    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledOnce();
    expect(activityAuditApi.getRevisionDetails).toHaveBeenCalledWith('/models/gpt-4/revision/0', TOKEN_MOCK);
    expect(result.previousRevision).toBeNull();
  });

  test('Should request no snapshot for a resource type with no revision route', async () => {
    resolveAdminActivity({ ...ADMIN_ACTIVITY, resourceType: 'UnknownResource' as ActivityAuditResourceType });

    const result = await getActivityAuditDetailData('activity-admin', TOKEN_MOCK);

    expect(activityAuditApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(result.activity).toBeTruthy();
    expect(result.activityRevision).toBeNull();
  });

  test('Should return an empty result when a lookup fails', async () => {
    vi.mocked(activityAuditApi.getActivityById).mockRejectedValue(new Error('backend is down'));

    const result = await getActivityAuditDetailData('activity-admin', TOKEN_MOCK);

    expect(result).toEqual({ activity: null, activityRevision: null, previousRevision: null, entity: void 0 });
    expect(errorObjLog).toHaveBeenCalledOnce();
  });
});

describe('getActivityAuditDetailData :: deployment activities', () => {
  beforeEach(() => {
    missAdminActivity();
  });

  test('Should resolve a container deployment activity without issuing the analytics lookup', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    resolveDeploymentActivity(DEPLOYMENT_ACTIVITY);
    vi.mocked(containersApi.getRevisionDetails).mockResolvedValue({ name: 'mcp-runner' });

    const result = await getActivityAuditDetailData('activity-deployment', TOKEN_MOCK);

    expect(result.activity).toEqual(DEPLOYMENT_ACTIVITY);
    expect(result.activityRevision).toEqual({ name: 'mcp-runner' });
    expect(containersApi.getRevisionDetails).toHaveBeenCalledWith('/deployments/mcp-runner/revision/3', TOKEN_MOCK);
    expect(deploymentAuditApi.getActivitiesList).toHaveBeenCalledWith(1, 0, TOKEN_MOCK, SORT_BY_TIME_DESC, [
      { column: 'resourceId', value: 'mcp-runner', operator: FilterOperatorDto.EQUALS },
    ]);
    expect(analyticsAuditApi.getActivityById).not.toHaveBeenCalled();
    expect(analyticsAuditApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(analyticsAuditApi.getActivitiesList).not.toHaveBeenCalled();
  });

  test('Should resolve an image definition activity through the images client', async () => {
    resolveDeploymentActivity(IMAGE_ACTIVITY);
    vi.mocked(imagesApi.getRevisionDetails).mockResolvedValue({ name: 'mcp-image' });

    const result = await getActivityAuditDetailData('activity-image', TOKEN_MOCK);

    expect(result.activityRevision).toEqual({ name: 'mcp-image' });
    expect(imagesApi.getRevisionDetails).toHaveBeenCalledWith('/images/definitions/mcp-image/revision/2', TOKEN_MOCK);
    expect(containersApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(analyticsAuditApi.getRevisionDetails).not.toHaveBeenCalled();
  });

  test('Should resolve a global firewall activity through the firewall client and its resource-type filter', async () => {
    resolveDeploymentActivity(FIREWALL_ACTIVITY);
    vi.mocked(globalFirewallApi.getRevisionDetails).mockResolvedValue(['epam.com']);

    const result = await getActivityAuditDetailData('activity-firewall', TOKEN_MOCK);

    expect(result.activityRevision).toEqual({ domains: ['epam.com'] });
    expect(globalFirewallApi.getRevisionDetails).toHaveBeenCalledWith(4, TOKEN_MOCK);
    expect(deploymentAuditApi.getActivitiesList).toHaveBeenCalledWith(1, 0, TOKEN_MOCK, SORT_BY_TIME_DESC, [
      {
        column: 'resourceType',
        value: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
        operator: FilterOperatorDto.EQUALS,
      },
    ]);
  });

  test('Should discard an activity whose resource type no handler owns', async () => {
    resolveDeploymentActivity({ ...DEPLOYMENT_ACTIVITY, resourceType: ActivityAuditResourceType.MODEL });

    const result = await getActivityAuditDetailData('activity-deployment', TOKEN_MOCK);

    expect(result.activity).toBeNull();
    expect(containersApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(imagesApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(globalFirewallApi.getRevisionDetails).not.toHaveBeenCalled();
  });
});

describe('getActivityAuditDetailData :: analytics activities', () => {
  beforeEach(() => {
    missAdminActivity();
    missDeploymentActivity();
  });

  test('Should resolve an analytics activity after both existing lookups miss', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    vi.mocked(analyticsAuditApi.getActivitiesList).mockResolvedValue(pageOf([{ ...ANALYTICS_ACTIVITY, revision: 11 }]));
    vi.mocked(analyticsAuditApi.getRevisionDetails).mockImplementation((url) => Promise.resolve({ url }));

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(result.activity).toEqual(ANALYTICS_ACTIVITY);
    expect(result.activityRevision).toEqual({ url: '/tables/orders/revision/7' });
    expect(result.previousRevision).toEqual({ url: '/tables/orders/revision/6' });
    expect(result.entity).toEqual({ url: '/tables/orders/revision/11' });
    expect(analyticsAuditApi.getActivitiesList).toHaveBeenCalledWith(1, 0, TOKEN_MOCK, SORT_BY_TIME_DESC, [
      { column: 'resourceId', value: 'orders:total', operator: FilterOperatorDto.EQUALS },
    ]);
    expect(activityAuditApi.getRevisionDetails).not.toHaveBeenCalled();
    expect(containersApi.getRevisionDetails).not.toHaveBeenCalled();
  });

  test('Should fetch the current, previous and latest-revision snapshots with the two revisions in parallel', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    const pendingList = deferred<AuditPageData<DialActivity> | null>();
    vi.mocked(analyticsAuditApi.getActivitiesList).mockReturnValue(pendingList.promise);

    const pending = getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);
    await tick();

    expect(analyticsAuditApi.getActivitiesList).toHaveBeenCalledOnce();
    expect(analyticsAuditApi.getRevisionDetails).toHaveBeenCalledTimes(2);

    pendingList.resolve(pageOf([{ ...ANALYTICS_ACTIVITY, revision: 11 }]));
    await pending;

    expect(analyticsAuditApi.getRevisionDetails).toHaveBeenCalledTimes(3);
    expect(analyticsAuditApi.getRevisionDetails).toHaveBeenLastCalledWith('/tables/orders/revision/11', TOKEN_MOCK);
  });

  test('Should render a snapshot the backend answers as absent as a null revision', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    vi.mocked(analyticsAuditApi.getRevisionDetails).mockResolvedValue(null);

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(result.activity).toEqual(ANALYTICS_ACTIVITY);
    expect(result.activityRevision).toBeNull();
    expect(result.previousRevision).toBeNull();
    expect(result.entity).toBeUndefined();
    expect(errorObjLog).not.toHaveBeenCalled();
  });

  // `entity` is typed `BaseEntity | undefined`, and the only other test that reaches an undefined
  // `entity` does so by never asking for it (no latest revision in the list). This one asks and is
  // told the snapshot does not exist, which is the branch that used to leak a `null` past the type.
  test('Should leave the entity undefined when the latest-revision snapshot does not exist', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    vi.mocked(analyticsAuditApi.getActivitiesList).mockResolvedValue(pageOf([{ ...ANALYTICS_ACTIVITY, revision: 11 }]));
    vi.mocked(analyticsAuditApi.getRevisionDetails).mockResolvedValue(null);

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(analyticsAuditApi.getRevisionDetails).toHaveBeenCalledWith('/tables/orders/revision/11', TOKEN_MOCK);
    expect(result.entity).toBeUndefined();
  });

  test('Should issue no analytics lookup when ANALYTICS_ENABLED is unset', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', void 0);

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(analyticsAuditApi.getActivityById).not.toHaveBeenCalled();
    expect(result.activity).toBeNull();
  });

  test('Should issue no analytics lookup when ANALYTICS_ENABLED is the string "false"', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'false');

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(analyticsAuditApi.getActivityById).not.toHaveBeenCalled();
    expect(result.activity).toBeNull();
  });
});

/**
 * The chain probes three backends in turn, and only one of them is guaranteed to be configured on a
 * given install: `DIAL_DEPLOYMENTS_API_URL` is optional and is not even listed in `.env.template`.
 * An unset or unreachable host makes its client's `fetch` **reject**, which is a different event
 * from the backend answering "I do not own this activity" — and a rejection at an earlier step must
 * not decide the outcome of a later one. Every case here rejects a probe rather than resolving it
 * with `success: false`, which is the distinction the rest of this suite never draws.
 */
describe('getActivityAuditDetailData :: a backend that rejects instead of answering', () => {
  const FETCH_FAILED = new TypeError('fetch failed');

  test('Should still resolve an analytics activity when the deployment lookup rejects', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    missAdminActivity();
    vi.mocked(deploymentAuditApi.getActivityById).mockRejectedValue(FETCH_FAILED);
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    vi.mocked(analyticsAuditApi.getRevisionDetails).mockImplementation((url) => Promise.resolve({ url }));

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(analyticsAuditApi.getActivityById).toHaveBeenCalledWith('activity-analytics', TOKEN_MOCK);
    expect(result.activity).toEqual(ANALYTICS_ACTIVITY);
    expect(result.activityRevision).toEqual({ url: '/tables/orders/revision/7' });
    expect(result.previousRevision).toEqual({ url: '/tables/orders/revision/6' });
  });

  test('Should name the failing backend and the route it asked for when a lookup rejects', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    missAdminActivity();
    vi.mocked(deploymentAuditApi.getActivityById).mockRejectedValue(FETCH_FAILED);
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });

    await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(errorObjLog).toHaveBeenCalledOnce();
    expect(errorObjLog).toHaveBeenCalledWith(
      FETCH_FAILED,
      'Activity lookup failed on the deployment manager backend: api/v1/activities/activity-analytics',
    );
  });

  test('Should log nothing when a backend merely does not own the activity', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    missAdminActivity();
    missDeploymentActivity();
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });

    await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(errorObjLog).not.toHaveBeenCalled();
  });

  test('Should keep probing the later backends when the admin lookup rejects', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    vi.mocked(activityAuditApi.getActivityById).mockRejectedValue(FETCH_FAILED);
    missDeploymentActivity();
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(deploymentAuditApi.getActivityById).toHaveBeenCalledWith('activity-analytics', TOKEN_MOCK);
    expect(result.activity).toEqual(ANALYTICS_ACTIVITY);
    expect(errorObjLog).toHaveBeenCalledWith(
      FETCH_FAILED,
      'Activity lookup failed on the admin backend: api/v1/activities/activity-analytics',
    );
  });

  test('Should resolve an admin activity even though the deployment backend is unreachable', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    resolveAdminActivity();
    vi.mocked(deploymentAuditApi.getActivityById).mockRejectedValue(FETCH_FAILED);

    const result = await getActivityAuditDetailData('activity-admin', TOKEN_MOCK);

    expect(result.activity).toEqual(ADMIN_ACTIVITY);
    expect(deploymentAuditApi.getActivityById).not.toHaveBeenCalled();
    expect(errorObjLog).not.toHaveBeenCalled();
  });

  test('Should keep the current snapshot when the previous-revision snapshot rejects', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    missAdminActivity();
    missDeploymentActivity();
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    vi.mocked(analyticsAuditApi.getRevisionDetails).mockImplementation((url) =>
      url.endsWith('/6') ? Promise.reject(FETCH_FAILED) : Promise.resolve({ url }),
    );

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(result.activity).toEqual(ANALYTICS_ACTIVITY);
    expect(result.activityRevision).toEqual({ url: '/tables/orders/revision/7' });
    expect(result.previousRevision).toBeNull();
    expect(errorObjLog).toHaveBeenCalledWith(
      FETCH_FAILED,
      'Failed to fetch a revision snapshot for activity activity-analytics',
    );
  });

  test('Should render both snapshots when the activities list rejects', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'true');
    missAdminActivity();
    missDeploymentActivity();
    vi.mocked(analyticsAuditApi.getActivityById).mockResolvedValue({ success: true, response: ANALYTICS_ACTIVITY });
    vi.mocked(analyticsAuditApi.getActivitiesList).mockRejectedValue(FETCH_FAILED);
    vi.mocked(analyticsAuditApi.getRevisionDetails).mockImplementation((url) => Promise.resolve({ url }));

    const result = await getActivityAuditDetailData('activity-analytics', TOKEN_MOCK);

    expect(result.activity).toEqual(ANALYTICS_ACTIVITY);
    expect(result.activityRevision).toEqual({ url: '/tables/orders/revision/7' });
    expect(result.previousRevision).toEqual({ url: '/tables/orders/revision/6' });
    expect(result.entity).toBeUndefined();
    expect(errorObjLog).toHaveBeenCalledWith(
      FETCH_FAILED,
      'Failed to fetch the activity list for activity activity-analytics',
    );
  });
});

/**
 * The scenarios behind this block are structural: every audit detail page resolves through this one
 * module, and the two resolvers it replaced are gone. Nothing else in the suite renders these server
 * pages, so a page reverted to a private resolver would be invisible without reading the source.
 */
describe('getActivityAuditDetailData :: page wiring', () => {
  const RESOLVER_IMPORT =
    /^import \{ getActivityAuditDetailData \} from '@\/src\/utils\/audit\/get-activity-audit-detail-data';$/m;
  const APP_DIR = join(__dirname, '../../../app/[lang]');

  const GLOBAL_PAGE = 'activity-audit/[id]/page.tsx';

  const DEPLOYMENT_PAGES = [
    'model-servings',
    'mcp-containers',
    'adapter-containers',
    'application-containers',
    'interceptor-containers',
    'deployment-images',
  ];

  const ADMIN_PAGES = [
    'models',
    'adapters',
    'applications',
    'interceptors',
    'roles',
    'keys',
    'routes',
    'toolsets',
    'application-runners',
    'interceptor-templates',
  ];

  const readPage = (relativePath: string) => readFileSync(join(APP_DIR, relativePath), 'utf-8');

  test('Should resolve the global detail page through the unified resolver', () => {
    expect(readPage(GLOBAL_PAGE)).toMatch(RESOLVER_IMPORT);
    expect(existsSync(join(APP_DIR, 'activity-audit/[id]/resolver.ts'))).toBe(false);
  });

  test.each(DEPLOYMENT_PAGES)('Should resolve the %s entity-namespaced page through the unified resolver', (route) => {
    const page = readPage(`${route}/[id]/[subId]/page.tsx`);

    expect(page).toMatch(RESOLVER_IMPORT);
    expect(page).toContain('isEntityActivity');
  });

  test.each(ADMIN_PAGES)('Should resolve the %s entity-namespaced page through the unified resolver', (route) => {
    const page = readPage(`${route}/[id]/[subId]/page.tsx`);

    expect(page).toMatch(RESOLVER_IMPORT);
    expect(page).toContain('isEntityActivity');
  });

  test('Should no longer ship the legacy admin-only resolver', () => {
    expect(existsSync(join(__dirname, '../get-audit-activity-data.ts'))).toBe(false);
  });
});
