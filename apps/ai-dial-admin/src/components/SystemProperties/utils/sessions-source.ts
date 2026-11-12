import { REQUIRED_SESSIONS_ROLES } from '@/src/constants/analytics/sessions-source';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SessionsRole, SessionsSourceRoles, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';
import { roleFieldOptions } from '@/src/utils/analytics/sessions-source';

const keptField = (role: SessionsRole, roles: SessionsSourceRoles, fields: AnalyticsEntityField[]): string | null => {
  const name = roles[role];

  return name && roleFieldOptions(role, fields).some((field) => field.name === name) ? name : null;
};

export const keepRolesInSchema = (roles: SessionsSourceRoles, fields: AnalyticsEntityField[]): SessionsSourceRoles => ({
  [SessionsRole.SessionId]: keptField(SessionsRole.SessionId, roles, fields) ?? '',
  [SessionsRole.Time]: keptField(SessionsRole.Time, roles, fields) ?? '',
  [SessionsRole.Project]: keptField(SessionsRole.Project, roles, fields),
  [SessionsRole.Title]: keptField(SessionsRole.Title, roles, fields),
  [SessionsRole.Cost]: keptField(SessionsRole.Cost, roles, fields),
  [SessionsRole.Turns]: keptField(SessionsRole.Turns, roles, fields),
});

export const isSessionsRoleRequired = (role: SessionsRole): boolean => REQUIRED_SESSIONS_ROLES.includes(role);

export const unboundRequiredRoles = (setting: SessionsSourceSetting): SessionsRole[] =>
  REQUIRED_SESSIONS_ROLES.filter((role) => !setting.roles[role]);

export const isSessionsSourceComplete = (setting: SessionsSourceSetting): boolean =>
  !!setting.baseTable && unboundRequiredRoles(setting).length === 0;
