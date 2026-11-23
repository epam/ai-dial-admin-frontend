import { describe, expect, test } from 'vitest';

import {
  isSessionsRoleRequired,
  isSessionsSourceComplete,
  keepRolesInSchema,
  unboundRequiredRoles,
} from '@/src/components/SystemProperties/utils/sessions-source';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SessionsRole, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';

const field = (name: string, type: AnalyticsFieldType): AnalyticsEntityField => ({ name, type, source: 'column' });

const ROLES = DEFAULT_SESSIONS_SOURCE_SETTING.roles;

describe('keepRolesInSchema', () => {
  test('keeps every role whose field the schema reports with a fitting type', () => {
    const fields = [
      field(ROLES[SessionsRole.SessionId], AnalyticsFieldType.String),
      field(ROLES[SessionsRole.Time], AnalyticsFieldType.Timestamp),
      field(ROLES[SessionsRole.Project] as string, AnalyticsFieldType.String),
      field(ROLES[SessionsRole.Title] as string, AnalyticsFieldType.String),
      field(ROLES[SessionsRole.Cost] as string, AnalyticsFieldType.Decimal),
      field(ROLES[SessionsRole.Turns] as string, AnalyticsFieldType.Integer),
    ];

    expect(keepRolesInSchema(ROLES, fields)).toEqual(ROLES);
  });

  test('clears roles whose field the schema does not report', () => {
    const fields = [
      field(ROLES[SessionsRole.SessionId], AnalyticsFieldType.String),
      field(ROLES[SessionsRole.Turns] as string, AnalyticsFieldType.Long),
    ];

    expect(keepRolesInSchema(ROLES, fields)).toEqual({
      [SessionsRole.SessionId]: ROLES[SessionsRole.SessionId],
      [SessionsRole.Time]: '',
      [SessionsRole.Project]: null,
      [SessionsRole.Title]: null,
      [SessionsRole.Cost]: null,
      [SessionsRole.Turns]: ROLES[SessionsRole.Turns],
    });
  });

  test('clears a role whose field the schema reports with a type the role does not accept', () => {
    const fields = [field(ROLES[SessionsRole.Time], AnalyticsFieldType.String)];

    expect(keepRolesInSchema(ROLES, fields)[SessionsRole.Time]).toBe('');
  });

  test('clears every role against an empty schema', () => {
    expect(keepRolesInSchema(ROLES, [])).toEqual({
      [SessionsRole.SessionId]: '',
      [SessionsRole.Time]: '',
      [SessionsRole.Project]: null,
      [SessionsRole.Title]: null,
      [SessionsRole.Cost]: null,
      [SessionsRole.Turns]: null,
    });
  });
});

describe('isSessionsRoleRequired', () => {
  test('marks Session id and Time as required and the rest as optional', () => {
    expect(isSessionsRoleRequired(SessionsRole.SessionId)).toBe(true);
    expect(isSessionsRoleRequired(SessionsRole.Time)).toBe(true);
    expect(isSessionsRoleRequired(SessionsRole.Project)).toBe(false);
    expect(isSessionsRoleRequired(SessionsRole.Cost)).toBe(false);
  });
});

describe('unboundRequiredRoles and isSessionsSourceComplete', () => {
  const withRoles = (
    roles: Partial<SessionsSourceSetting['roles']>,
    baseTable = 'sessions',
  ): SessionsSourceSetting => ({
    baseTable,
    roles: { ...ROLES, ...roles },
  });

  test('reports the default binding as complete', () => {
    expect(unboundRequiredRoles(DEFAULT_SESSIONS_SOURCE_SETTING)).toEqual([]);
    expect(isSessionsSourceComplete(DEFAULT_SESSIONS_SOURCE_SETTING)).toBe(true);
  });

  test('names each unbound required role', () => {
    const setting = withRoles({ [SessionsRole.SessionId]: '', [SessionsRole.Time]: '' });

    expect(unboundRequiredRoles(setting)).toEqual([SessionsRole.SessionId, SessionsRole.Time]);
    expect(isSessionsSourceComplete(setting)).toBe(false);
  });

  test('stays complete without optional roles', () => {
    expect(isSessionsSourceComplete(withRoles({ [SessionsRole.Cost]: null, [SessionsRole.Title]: null }))).toBe(true);
  });

  test('is incomplete without a base table', () => {
    expect(isSessionsSourceComplete(withRoles({}, ''))).toBe(false);
  });
});
