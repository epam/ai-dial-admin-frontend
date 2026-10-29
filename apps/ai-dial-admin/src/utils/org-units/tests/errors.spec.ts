import { describe, expect, test } from 'vitest';

import { OrgUnitErrorKind, mapOrgUnitError } from '../errors';

describe('mapOrgUnitError', () => {
  test.each([
    [400, OrgUnitErrorKind.FIELD],
    [409, OrgUnitErrorKind.FIELD],
    [403, OrgUnitErrorKind.FORBIDDEN],
    [404, OrgUnitErrorKind.NOT_FOUND],
    [500, OrgUnitErrorKind.UNAVAILABLE],
    [undefined, OrgUnitErrorKind.UNAVAILABLE],
  ])('maps status %s to %s', (status, kind) => {
    expect(mapOrgUnitError({ success: false, status, errorMessage: 'm' })).toEqual({ kind, status, message: 'm' });
  });
});
