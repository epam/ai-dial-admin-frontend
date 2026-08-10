import { describe, expect, test } from 'vitest';

import {
  describeSavedQueryError,
  isSavedQueryGone,
  resolveSavedQueryErrorCode,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { SavedQueryErrorCode } from '@/src/models/analytics/saved-query';

const failure = (status: number, errorHeader?: string, errorMessage?: string) => ({
  success: false,
  status,
  errorHeader,
  errorMessage,
});

describe('resolveSavedQueryErrorCode', () => {
  test.each([
    [400, SavedQueryErrorCode.BadRequest],
    [422, SavedQueryErrorCode.SensitiveLiteralNotAllowed],
    [422, SavedQueryErrorCode.ValidationError],
    [403, SavedQueryErrorCode.Forbidden],
    [404, SavedQueryErrorCode.NotFound],
    [500, SavedQueryErrorCode.PrincipalUnavailable],
  ])('recognises %s %s from the machine code', (status, code) => {
    expect(resolveSavedQueryErrorCode(failure(status, code))).toBe(code);
  });

  test("the 'Request error' placeholder is not mistaken for a machine code", () => {
    expect(resolveSavedQueryErrorCode(failure(500, 'Request error'))).toBeNull();
  });

  test('an unrecognised code falls back to null rather than being surfaced raw', () => {
    expect(resolveSavedQueryErrorCode(failure(418, 'i_am_a_teapot'))).toBeNull();
  });

  test('a status whose meaning is already fixed resolves without a code', () => {
    expect(resolveSavedQueryErrorCode(failure(403))).toBe(SavedQueryErrorCode.Forbidden);
    expect(resolveSavedQueryErrorCode(failure(404, 'Request error'))).toBe(SavedQueryErrorCode.NotFound);
  });
});

describe('describeSavedQueryError', () => {
  test('an untranslatable body surfaces the service message alongside the hint', () => {
    const descriptor = describeSavedQueryError(
      failure(400, SavedQueryErrorCode.BadRequest, "unknown field 'user_hash'"),
    );

    expect(descriptor.showServerMessage).toBe(true);
    expect(descriptor.serverMessage).toBe("unknown field 'user_hash'");
  });

  test('a sensitive literal keeps the service message, which is what names the column', () => {
    const descriptor = describeSavedQueryError(
      failure(422, SavedQueryErrorCode.SensitiveLiteralNotAllowed, "column 'user_email' is sensitive"),
    );

    expect(descriptor.hintKey).toBe(QueryBuilderI18nKey.SavedQueryErrorSensitiveLiteral);
    expect(descriptor.serverMessage).toBe("column 'user_email' is sensitive");
  });

  test('a missing principal is reported as configuration, without the service message', () => {
    const descriptor = describeSavedQueryError(
      failure(500, SavedQueryErrorCode.PrincipalUnavailable, 'principal claim absent'),
    );

    expect(descriptor.hintKey).toBe(QueryBuilderI18nKey.SavedQueryErrorPrincipalUnavailable);
    expect(descriptor.showServerMessage).toBe(false);
    expect(descriptor.serverMessage).toBeUndefined();
  });

  test('forbidden and not-found get their own hints', () => {
    expect(describeSavedQueryError(failure(403, SavedQueryErrorCode.Forbidden)).hintKey).toBe(
      QueryBuilderI18nKey.SavedQueryErrorForbidden,
    );
    expect(describeSavedQueryError(failure(404, SavedQueryErrorCode.NotFound)).hintKey).toBe(
      QueryBuilderI18nKey.SavedQueryErrorNotFound,
    );
  });

  test('an unrecognised failure falls back to the generic hint', () => {
    const descriptor = describeSavedQueryError(failure(418, 'i_am_a_teapot', 'short and stout'));

    expect(descriptor.code).toBeNull();
    expect(descriptor.hintKey).toBe(QueryBuilderI18nKey.SavedQueryErrorGeneric);
    expect(descriptor.showServerMessage).toBe(false);
  });
});

describe('isSavedQueryGone', () => {
  test('only a not-found means the row is gone', () => {
    expect(isSavedQueryGone(SavedQueryErrorCode.NotFound)).toBe(true);
    expect(isSavedQueryGone(SavedQueryErrorCode.Forbidden)).toBe(false);
    expect(isSavedQueryGone(null)).toBe(false);
  });
});
