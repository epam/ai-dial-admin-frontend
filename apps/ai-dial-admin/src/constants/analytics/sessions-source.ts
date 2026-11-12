import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SessionsField } from '@/src/models/analytics/sessions-trace';
import { SessionsRole, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';

export const DEFAULT_SESSIONS_SOURCE_SETTING: SessionsSourceSetting = {
  baseTable: 'sessions',
  roles: {
    [SessionsRole.SessionId]: SessionsField.ChatId,
    [SessionsRole.Time]: SessionsField.LastRequestTime,
    [SessionsRole.Project]: SessionsField.ProjectId,
    [SessionsRole.Title]: SessionsField.InsightTitle,
    [SessionsRole.Cost]: SessionsField.TotalPrice,
    [SessionsRole.Turns]: SessionsField.TurnCount,
  },
};

export const REQUIRED_SESSIONS_ROLES: SessionsRole[] = [SessionsRole.SessionId, SessionsRole.Time];

export const SESSIONS_ROLES: SessionsRole[] = Object.values(SessionsRole);

export const SESSIONS_ROLE_FIELD_TYPES: Record<SessionsRole, AnalyticsFieldType[]> = {
  [SessionsRole.SessionId]: [AnalyticsFieldType.String],
  [SessionsRole.Time]: [AnalyticsFieldType.Timestamp],
  [SessionsRole.Project]: [AnalyticsFieldType.String],
  [SessionsRole.Title]: [AnalyticsFieldType.String],
  [SessionsRole.Cost]: [AnalyticsFieldType.Decimal, AnalyticsFieldType.Integer, AnalyticsFieldType.Long],
  [SessionsRole.Turns]: [AnalyticsFieldType.Integer, AnalyticsFieldType.Long],
};

export const SESSIONS_ROLE_CANONICAL_FIELD: Record<SessionsRole, SessionsField> = {
  [SessionsRole.SessionId]: SessionsField.ChatId,
  [SessionsRole.Time]: SessionsField.LastRequestTime,
  [SessionsRole.Project]: SessionsField.ProjectId,
  [SessionsRole.Title]: SessionsField.InsightTitle,
  [SessionsRole.Cost]: SessionsField.TotalPrice,
  [SessionsRole.Turns]: SessionsField.TurnCount,
};
