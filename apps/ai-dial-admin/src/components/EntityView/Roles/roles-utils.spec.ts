import { isResetAvailable, getRolesGridData } from './roles-utils';

describe('Roles View :: isResetAvailable', () => {
  it('Should return true', () => {
    const res = isResetAvailable({
      defaultRoleLimit: { day: '2', minute: '2' },
      roleLimits: { limit: { day: '1', minute: '1' } },
    });
    expect(res).toBeTruthy();
  });

  it('Should return true', () => {
    const res = isResetAvailable({
      defaultRoleLimit: { day: '1', minute: '2' },
      roleLimits: { limit: { day: '1', minute: '1' } },
    });
    expect(res).toBeTruthy();
  });
});

describe('Roles View :: getRolesGridData', () => {
  it('Should return role for isPublic true', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {
          limit: { day: '1', minute: '1' },
          limit1: { day: '1', minute: '1' },
          limit2: { day: null, minute: null },
        },
      },
      [{ name: 'limit' }, { name: 'limit2' }, {}],
    );
    expect(res).toEqual([
      { name: 'limit', day: '1', minute: '1' },
      { name: 'limit2', day: null, minute: null },
      { day: '2', minute: '2' },
    ]);
  });

  it('Should return role for isPublic false', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1' } },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([{ name: 'limit', day: '1', minute: '1' }]);
  });

  it('Should return empty array for isPublic false', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([]);
  });
});
