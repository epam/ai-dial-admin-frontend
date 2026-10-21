import { describe, expect, test } from 'vitest';

import { AuditRequestError, getAuditRequestFailure } from '@/src/utils/audit/audit-request-error';

describe('getAuditRequestFailure', () => {
  test('hands back an audit request error with what the service said', () => {
    const error = new AuditRequestError({ errorHeader: 'invalid_filter_value', errorMessage: 'bad', requestId: 'r1' });

    expect(getAuditRequestFailure(error)).toMatchObject({
      errorHeader: 'invalid_filter_value',
      errorMessage: 'bad',
      requestId: 'r1',
    });
  });

  test('takes the message of any other error and nothing else', () => {
    expect(getAuditRequestFailure(new Error('feed unavailable'))).toEqual({ errorMessage: 'feed unavailable' });
  });

  test('has no message for a value that is not an error', () => {
    expect(getAuditRequestFailure('boom')).toEqual({ errorMessage: undefined });
  });
});
