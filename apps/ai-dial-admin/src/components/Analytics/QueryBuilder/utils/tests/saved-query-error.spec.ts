import { describe, expect, test } from 'vitest';

import {
  describeSavedQueryError,
  isSavedQueryGone,
  resolveSavedQueryErrorCode,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { QueriesI18nKey } from '@/src/constants/i18n';
import { SavedQueryErrorCode } from '@/src/models/analytics/saved-query';
import { ServerActionResponse } from '@/src/models/server-action';

const failure = (overrides?: Partial<ServerActionResponse>): ServerActionResponse => ({
  success: false,
  ...overrides,
});

describe('resolveSavedQueryErrorCode', () => {
  test.each([
    SavedQueryErrorCode.BadRequest,
    SavedQueryErrorCode.ValidationError,
    SavedQueryErrorCode.SensitiveLiteralNotAllowed,
    SavedQueryErrorCode.Forbidden,
    SavedQueryErrorCode.NotFound,
    SavedQueryErrorCode.PrincipalUnavailable,
  ])('reads %s off the failure envelope', (code) => {
    expect(resolveSavedQueryErrorCode(failure({ errorHeader: code }))).toBe(code);
  });

  test('ignores the generic placeholder the error parser substitutes for a missing code', () => {
    expect(resolveSavedQueryErrorCode(failure({ errorHeader: 'Request error', status: 500 }))).toBeNull();
  });

  test('ignores an unrecognised code rather than passing it through', () => {
    expect(resolveSavedQueryErrorCode(failure({ errorHeader: 'teapot', status: 418 }))).toBeNull();
  });

  test('falls back to the status for a forbidden response with no code', () => {
    expect(resolveSavedQueryErrorCode(failure({ status: 403 }))).toBe(SavedQueryErrorCode.Forbidden);
  });

  test('falls back to the status for a not-found response with no code', () => {
    expect(resolveSavedQueryErrorCode(failure({ status: 404 }))).toBe(SavedQueryErrorCode.NotFound);
  });

  test('does not guess a code from any other status', () => {
    expect(resolveSavedQueryErrorCode(failure({ status: 500 }))).toBeNull();
  });

  test('prefers the envelope code over the status', () => {
    const res = failure({ errorHeader: SavedQueryErrorCode.ValidationError, status: 404 });

    expect(resolveSavedQueryErrorCode(res)).toBe(SavedQueryErrorCode.ValidationError);
  });
});

describe('describeSavedQueryError', () => {
  test.each([
    [SavedQueryErrorCode.BadRequest, QueriesI18nKey.ErrorGeneric],
    [SavedQueryErrorCode.ValidationError, QueriesI18nKey.ErrorValidation],
    [SavedQueryErrorCode.SensitiveLiteralNotAllowed, QueriesI18nKey.ErrorSensitiveLiteral],
    [SavedQueryErrorCode.Forbidden, QueriesI18nKey.ErrorForbidden],
    [SavedQueryErrorCode.NotFound, QueriesI18nKey.ErrorNotFound],
    [SavedQueryErrorCode.PrincipalUnavailable, QueriesI18nKey.ErrorPrincipalUnavailable],
  ])('maps %s to its own guidance', (code, hintKey) => {
    expect(describeSavedQueryError(failure({ errorHeader: code })).hintKey).toBe(hintKey);
  });

  test('falls back to generic guidance when no code could be resolved', () => {
    const descriptor = describeSavedQueryError(failure({ status: 500 }));

    expect(descriptor.code).toBeNull();
    expect(descriptor.hintKey).toBe(QueriesI18nKey.ErrorGeneric);
  });

  test.each([
    SavedQueryErrorCode.BadRequest,
    SavedQueryErrorCode.ValidationError,
    SavedQueryErrorCode.SensitiveLiteralNotAllowed,
  ])('surfaces the service message for %s, which names the offending part of the query', (code) => {
    const descriptor = describeSavedQueryError(failure({ errorHeader: code, errorMessage: 'filter[0] is invalid' }));

    expect(descriptor.isServerMessageShown).toBeTruthy();
    expect(descriptor.serverMessage).toBe('filter[0] is invalid');
  });

  test.each([SavedQueryErrorCode.Forbidden, SavedQueryErrorCode.NotFound, SavedQueryErrorCode.PrincipalUnavailable])(
    'withholds the service message for %s, which would disclose existence or access',
    (code) => {
      const descriptor = describeSavedQueryError(failure({ errorHeader: code, errorMessage: 'saved query sq_9' }));

      expect(descriptor.isServerMessageShown).toBeFalsy();
      expect(descriptor.serverMessage).toBeUndefined();
    },
  );

  test('withholds the service message when no code was resolved', () => {
    const descriptor = describeSavedQueryError(failure({ status: 500, errorMessage: 'internal' }));

    expect(descriptor.serverMessage).toBeUndefined();
  });
});

describe('isSavedQueryGone', () => {
  test('treats not-found as gone', () => {
    expect(isSavedQueryGone(SavedQueryErrorCode.NotFound)).toBeTruthy();
  });

  test('does not treat forbidden as gone', () => {
    expect(isSavedQueryGone(SavedQueryErrorCode.Forbidden)).toBeFalsy();
  });

  test('does not treat an unresolved code as gone', () => {
    expect(isSavedQueryGone(null)).toBeFalsy();
  });
});
