export enum SessionsRole {
  SessionId = 'sessionId',
  Time = 'time',
  Project = 'project',
  Title = 'title',
  Cost = 'cost',
  Turns = 'turns',
}

export interface SessionsSourceRoles {
  [SessionsRole.SessionId]: string;
  [SessionsRole.Time]: string;
  [SessionsRole.Project]?: string | null;
  [SessionsRole.Title]?: string | null;
  [SessionsRole.Cost]?: string | null;
  [SessionsRole.Turns]?: string | null;
}

export interface SessionsSourceSetting {
  baseTable: string;
  roles: SessionsSourceRoles;
}

export interface SessionsSourceRolesDto {
  session_id: string;
  time: string;
  project?: string | null;
  title?: string | null;
  cost?: string | null;
  turns?: string | null;
}

export interface SessionsSourceSettingDto {
  base_table: string;
  roles: SessionsSourceRolesDto;
  updated_at?: string;
  updated_by?: string;
}

export interface SessionsSource {
  baseTable: string;
  sessionId: string;
  time: string;
  project: string | null;
  title: string | null;
  cost: string | null;
  turns: string | null;
  enrichments: string[];
  ratingEnrichment: string | null;
}

export interface SessionsSourceRoleFailure {
  role: SessionsRole;
  field: string;
}

export interface SessionsSourceResolution {
  source: SessionsSource | null;
  failure: SessionsSourceRoleFailure | null;
}
