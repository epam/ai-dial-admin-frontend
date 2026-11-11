import {
  DEFAULT_SESSIONS_SOURCE_SETTING,
  REQUIRED_SESSIONS_ROLES,
  SESSIONS_ROLE_CANONICAL_FIELD,
  SESSIONS_ROLE_FIELD_TYPES,
  SESSIONS_ROLES,
} from '@/src/constants/analytics/sessions-source';
import { RATING_SIGNATURE_FIELDS } from '@/src/constants/analytics/sessions-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  SessionsRole,
  SessionsSource,
  SessionsSourceResolution,
  SessionsSourceSetting,
  SessionsSourceSettingDto,
} from '@/src/models/analytics/sessions-source';
import { enrichmentOf } from '@/src/utils/analytics/session-enrichment';

export const enrichmentNamespacesOf = (fields: AnalyticsEntityField[] = []): string[] => [
  ...new Set(fields.map(({ name }) => enrichmentOf(name)).filter(Boolean)),
];

export const ratingEnrichmentOf = (fields: AnalyticsEntityField[] = []): string | null => {
  const names = new Set(fields.map(({ name }) => name));

  return (
    enrichmentNamespacesOf(fields).find((namespace) =>
      RATING_SIGNATURE_FIELDS.every((field) => names.has(`${namespace}.${field}`)),
    ) ?? null
  );
};

export const isFieldFitForRole = (role: SessionsRole, field: AnalyticsEntityField): boolean =>
  SESSIONS_ROLE_FIELD_TYPES[role].includes(field.type);

export const roleFieldOptions = (role: SessionsRole, fields: AnalyticsEntityField[] = []): AnalyticsEntityField[] =>
  fields.filter((field) => isFieldFitForRole(role, field));

const boundField = (
  setting: SessionsSourceSetting,
  role: SessionsRole,
  fields: AnalyticsEntityField[] | undefined,
): string | null => {
  const name = setting.roles[role] || null;

  if (!name) {
    return null;
  }

  if (!fields) {
    return REQUIRED_SESSIONS_ROLES.includes(role) || !enrichmentOf(name) ? name : null;
  }

  const field = fields.find((candidate) => candidate.name === name);

  return field && isFieldFitForRole(role, field) ? name : null;
};

export const resolveSessionsSource = (
  setting: SessionsSourceSetting | null | undefined,
  fields?: AnalyticsEntityField[],
): SessionsSourceResolution => {
  const binding = setting ?? DEFAULT_SESSIONS_SOURCE_SETTING;
  const resolved = (role: SessionsRole) => boundField(binding, role, fields);

  const missing = REQUIRED_SESSIONS_ROLES.find((role) => resolved(role) === null);

  if (missing) {
    return { source: null, failure: { role: missing, field: binding.roles[missing] ?? '' } };
  }

  const source: SessionsSource = {
    baseTable: binding.baseTable,
    sessionId: resolved(SessionsRole.SessionId) as string,
    time: resolved(SessionsRole.Time) as string,
    project: resolved(SessionsRole.Project),
    title: resolved(SessionsRole.Title),
    cost: resolved(SessionsRole.Cost),
    turns: resolved(SessionsRole.Turns),
    enrichments: enrichmentNamespacesOf(fields),
    ratingEnrichment: ratingEnrichmentOf(fields),
  };

  return { source, failure: null };
};

export const defaultSessionsSource = (): SessionsSource =>
  resolveSessionsSource(DEFAULT_SESSIONS_SOURCE_SETTING).source as SessionsSource;

export const settingFromDto = (dto: SessionsSourceSettingDto): SessionsSourceSetting => ({
  baseTable: dto.base_table,
  roles: {
    [SessionsRole.SessionId]: dto.roles.session_id,
    [SessionsRole.Time]: dto.roles.time,
    [SessionsRole.Project]: dto.roles.project ?? null,
    [SessionsRole.Title]: dto.roles.title ?? null,
    [SessionsRole.Cost]: dto.roles.cost ?? null,
    [SessionsRole.Turns]: dto.roles.turns ?? null,
  },
});

export const settingToDto = ({ baseTable, roles }: SessionsSourceSetting): SessionsSourceSettingDto => ({
  base_table: baseTable,
  roles: {
    session_id: roles[SessionsRole.SessionId],
    time: roles[SessionsRole.Time],
    project: roles[SessionsRole.Project] ?? null,
    title: roles[SessionsRole.Title] ?? null,
    cost: roles[SessionsRole.Cost] ?? null,
    turns: roles[SessionsRole.Turns] ?? null,
  },
});

const roleValue = (source: SessionsSource, role: SessionsRole): string | null => {
  switch (role) {
    case SessionsRole.SessionId:
      return source.sessionId;
    case SessionsRole.Time:
      return source.time;
    case SessionsRole.Project:
      return source.project;
    case SessionsRole.Title:
      return source.title;
    case SessionsRole.Cost:
      return source.cost;
    case SessionsRole.Turns:
      return source.turns;
  }
};

const roleOfCanonical = (name: string): SessionsRole | undefined =>
  SESSIONS_ROLES.find((role) => SESSIONS_ROLE_CANONICAL_FIELD[role] === name);

export const sourceFieldOf = (source: SessionsSource, name: string): string | null => {
  const role = roleOfCanonical(name);

  return role ? roleValue(source, role) : name;
};

export const roleBoundFields = (source: SessionsSource): string[] =>
  SESSIONS_ROLES.map((role) => roleValue(source, role)).filter((name): name is string => name !== null);

export const canonicalSessionRow = <T extends Record<string, unknown>>(source: SessionsSource, raw: T): T =>
  SESSIONS_ROLES.reduce<Record<string, unknown>>(
    (row, role) => {
      const bound = roleValue(source, role);
      const canonical = SESSIONS_ROLE_CANONICAL_FIELD[role];

      if (bound && bound !== canonical) {
        row[canonical] = raw[bound];
      }

      return row;
    },
    { ...raw },
  ) as T;
