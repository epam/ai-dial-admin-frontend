import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { OrgUnitSubjectFunction } from '@/src/models/dial/org-unit';
import { CoreOrgUnitsApi } from '../core-org-units-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const lastCall = () => {
  const [url, init] = fetch.mock.calls[0];
  return { url: String(url), init: init as RequestInit };
};

describe('CoreOrgUnitsApi', () => {
  const api = new CoreOrgUnitsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('listUnits asks for the recursive tree', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);
    const res = await api.listUnits(TOKEN_MOCK);

    expect(lastCall().url).toContain('v1/org-units/public?recursive=true');
    expect(lastCall().init.method).toBe('GET');
    expect(res.response).toEqual({ items: [] });
  });

  test('createUnit posts the body to the encoded parent path', async () => {
    fetch.mockResponseOnce(JSON.stringify({ id: '1' }));
    await api.createUnit(TOKEN_MOCK, 'public/Acme/US Risk', { name: 'QA', displayName: 'Quality' });

    expect(lastCall().url).toContain('v1/org-units/public/Acme/US%20Risk');
    expect(lastCall().init.method).toBe('POST');
    expect(JSON.parse(lastCall().init.body as string)).toEqual({ name: 'QA', displayName: 'Quality' });
  });

  test('createUnit under the shared space uses the base url', async () => {
    fetch.mockResponseOnce('{}');
    await api.createUnit(TOKEN_MOCK, 'public', { name: 'Acme' });

    expect(lastCall().url.endsWith('v1/org-units/public')).toBe(true);
  });

  test('renameUnit patches only the display name', async () => {
    fetch.mockResponseOnce('{}');
    await api.renameUnit(TOKEN_MOCK, 'public/Acme', 'Acme Corp');

    expect(lastCall().init.method).toBe('PATCH');
    expect(JSON.parse(lastCall().init.body as string)).toEqual({ displayName: 'Acme Corp' });
  });

  test('deleteUnit adds the recursive flag on request and returns the removed list', async () => {
    fetch.mockResponseOnce(JSON.stringify({ removed: ['public/Acme'] }), JSON_HEADERS);
    const res = await api.deleteUnit(TOKEN_MOCK, 'public/Acme', true);

    expect(lastCall().url).toContain('v1/org-units/public/Acme?recursive=true');
    expect(lastCall().init.method).toBe('DELETE');
    expect(res.response).toEqual({ removed: ['public/Acme'] });
  });

  test('deleteUnit without recursion sends no query', async () => {
    fetch.mockResponseOnce('{}');
    await api.deleteUnit(TOKEN_MOCK, 'public/Acme');

    expect(lastCall().url.endsWith('v1/org-units/public/Acme')).toBe(true);
  });

  test('role and assignment calls address the unit sub-resources', async () => {
    fetch.mockResponse('{}');
    await api.listRoles(TOKEN_MOCK, 'public/Acme');
    await api.listAssignments(TOKEN_MOCK, 'public/Acme');
    await api.addAssignment(TOKEN_MOCK, 'public/Acme', {
      roleName: 'editor',
      subject: { type: 'claimsPredicate', source: 'sub', function: OrgUnitSubjectFunction.TRUE },
    });
    const res = await api.removeAssignment(TOKEN_MOCK, 'public/Acme', 'a/b');

    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls[0]).toContain('v1/org-units/public/Acme/roles');
    expect(urls[1]).toContain('v1/org-units/public/Acme/role-assignments');
    expect(urls[2]).toContain('v1/org-units/public/Acme/role-assignments');
    expect(urls[3]).toContain('v1/org-units/public/Acme/role-assignments/a%2Fb');
    expect((fetch.mock.calls[2][1] as RequestInit).method).toBe('POST');
    expect((fetch.mock.calls[3][1] as RequestInit).method).toBe('DELETE');
    expect(res.success).toBe(true);
  });

  test('a core error surfaces its status and message', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: { message: 'Unit is not empty' } }), { status: 409 });
    const res = await api.deleteUnit(TOKEN_MOCK, 'public/Acme', true);

    expect(res.success).toBe(false);
    expect(res.status).toBe(409);
    expect(res.errorMessage).toContain('Unit is not empty');
  });
});
