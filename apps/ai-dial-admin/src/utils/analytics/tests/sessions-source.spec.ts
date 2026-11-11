import { describe, expect, test } from 'vitest';

import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SessionsRole, SessionsSource, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';
import {
  canonicalSessionRow,
  defaultSessionsSource,
  enrichmentNamespacesOf,
  ratingEnrichmentOf,
  resolveSessionsSource,
  roleBoundFields,
  roleFieldOptions,
  settingFromDto,
  settingToDto,
  sourceFieldOf,
} from '@/src/utils/analytics/sessions-source';

const schemaField = (name: string, type = AnalyticsFieldType.String): AnalyticsEntityField => ({
  name,
  type,
  source: name,
});

const sessionsSchema: AnalyticsEntityField[] = [
  schemaField('client_session_id'),
  schemaField('project_id'),
  schemaField('last_request_time', AnalyticsFieldType.Timestamp),
  schemaField('turn_count', AnalyticsFieldType.Long),
  schemaField('total_price', AnalyticsFieldType.Decimal),
  schemaField('traces', AnalyticsFieldType.Array),
  schemaField('session_insights.title'),
  schemaField('session_ratings.rate_pos_count', AnalyticsFieldType.Long),
  schemaField('session_ratings.rate_zero_count', AnalyticsFieldType.Long),
  schemaField('session_ratings.rate_neg_count', AnalyticsFieldType.Long),
];

const custom: SessionsSourceSetting = {
  baseTable: 'agent_runs',
  roles: { [SessionsRole.SessionId]: 'run_id', [SessionsRole.Time]: 'ended_at' },
};

describe('resolveSessionsSource', () => {
  test('uses the default binding when no setting is stored', () => {
    expect(resolveSessionsSource(null, sessionsSchema)).toEqual({
      source: {
        baseTable: 'sessions',
        sessionId: 'client_session_id',
        time: 'last_request_time',
        project: 'project_id',
        title: 'session_insights.title',
        cost: 'total_price',
        turns: 'turn_count',
        enrichments: ['session_insights', 'session_ratings'],
        ratingEnrichment: 'session_ratings',
      },
      failure: null,
    });
  });

  test('drops an optional role whose field the schema does not report', () => {
    const { source } = resolveSessionsSource(
      null,
      sessionsSchema.filter(({ name }) => name !== 'session_insights.title'),
    );

    expect(source?.title).toBeNull();
  });

  test('drops an optional role bound to a field of the wrong type', () => {
    const setting: SessionsSourceSetting = {
      ...DEFAULT_SESSIONS_SOURCE_SETTING,
      roles: { ...DEFAULT_SESSIONS_SOURCE_SETTING.roles, [SessionsRole.Cost]: 'project_id' },
    };

    expect(resolveSessionsSource(setting, sessionsSchema).source?.cost).toBeNull();
  });

  test('fails naming the role and field when a required field is absent', () => {
    expect(resolveSessionsSource(custom, [schemaField('run_id')])).toEqual({
      source: null,
      failure: { role: SessionsRole.Time, field: 'ended_at' },
    });
  });

  test('fails when a required role is unbound', () => {
    const setting = { baseTable: 't', roles: { [SessionsRole.SessionId]: '', [SessionsRole.Time]: 'at' } };

    expect(resolveSessionsSource(setting).failure).toEqual({ role: SessionsRole.SessionId, field: '' });
  });

  test('takes the binding as stored when no schema is available', () => {
    const { source } = resolveSessionsSource(custom);

    expect(source).toEqual({
      baseTable: 'agent_runs',
      sessionId: 'run_id',
      time: 'ended_at',
      project: null,
      title: null,
      cost: null,
      turns: null,
      enrichments: [],
      ratingEnrichment: null,
    });
  });
});

describe('defaultSessionsSource', () => {
  test('returns the default binding without enrichments', () => {
    expect(defaultSessionsSource()).toMatchObject({ baseTable: 'sessions', time: 'last_request_time' });
  });
});

describe('enrichmentNamespacesOf', () => {
  test('lists namespaces in the order they first appear', () => {
    expect(
      enrichmentNamespacesOf([schemaField('b.x'), schemaField('plain'), schemaField('a.y'), schemaField('b.z')]),
    ).toEqual(['b', 'a']);
  });

  test('returns an empty list without fields', () => {
    expect(enrichmentNamespacesOf()).toEqual([]);
  });
});

describe('ratingEnrichmentOf', () => {
  test('returns the first namespace carrying the whole rating signature', () => {
    const fields = [
      schemaField('partial.rate_pos_count'),
      ...['rate_pos_count', 'rate_zero_count', 'rate_neg_count'].flatMap((name) => [
        schemaField(`first.${name}`),
        schemaField(`second.${name}`),
      ]),
    ];

    expect(ratingEnrichmentOf(fields)).toBe('first');
  });

  test('returns null when no namespace carries the signature', () => {
    expect(ratingEnrichmentOf([schemaField('x.rate_pos_count')])).toBeNull();
    expect(ratingEnrichmentOf()).toBeNull();
  });
});

describe('roleFieldOptions', () => {
  test('offers only the fields of a type the role accepts', () => {
    expect(roleFieldOptions(SessionsRole.Time, sessionsSchema).map(({ name }) => name)).toEqual(['last_request_time']);
  });

  test('never offers an array field', () => {
    const names = Object.values(SessionsRole)
      .flatMap((role) => roleFieldOptions(role, sessionsSchema))
      .map(({ name }) => name);

    expect(names).not.toContain('traces');
  });

  test('returns nothing without a schema', () => {
    expect(roleFieldOptions(SessionsRole.Title)).toEqual([]);
  });
});

describe('settingToDto / settingFromDto', () => {
  test('round-trips a setting through the service shape', () => {
    const dto = settingToDto(DEFAULT_SESSIONS_SOURCE_SETTING);

    expect(dto).toEqual({
      base_table: 'sessions',
      roles: {
        session_id: 'client_session_id',
        time: 'last_request_time',
        project: 'project_id',
        title: 'session_insights.title',
        cost: 'total_price',
        turns: 'turn_count',
      },
    });
    expect(settingFromDto(dto)).toEqual(DEFAULT_SESSIONS_SOURCE_SETTING);
  });

  test('stores an unbound optional role as null', () => {
    expect(settingToDto(custom).roles).toEqual({
      session_id: 'run_id',
      time: 'ended_at',
      project: null,
      title: null,
      cost: null,
      turns: null,
    });
    expect(
      settingFromDto({ base_table: 't', roles: { session_id: 'a', time: 'b' } }).roles[SessionsRole.Cost],
    ).toBeNull();
  });
});

const customSource: SessionsSource = {
  baseTable: 'agent_runs',
  sessionId: 'run_id',
  time: 'ended_at',
  project: null,
  title: 'summary_title',
  cost: null,
  turns: 'steps',
  enrichments: [],
  ratingEnrichment: null,
};

describe('sourceFieldOf', () => {
  test('maps a canonical role field to the field its role is bound to', () => {
    expect(sourceFieldOf(customSource, 'client_session_id')).toBe('run_id');
    expect(sourceFieldOf(customSource, 'last_request_time')).toBe('ended_at');
    expect(sourceFieldOf(customSource, 'turn_count')).toBe('steps');
  });

  test('answers null for a canonical field whose role is unbound', () => {
    expect(sourceFieldOf(customSource, 'project_id')).toBeNull();
    expect(sourceFieldOf(customSource, 'total_price')).toBeNull();
  });

  test('passes a field that belongs to no role through unchanged', () => {
    expect(sourceFieldOf(customSource, 'region')).toBe('region');
    expect(sourceFieldOf(customSource, 'session_ratings.rate_pos_count')).toBe('session_ratings.rate_pos_count');
  });

  test('is the identity for every role on the default binding resolved against its schema', () => {
    const source = resolveSessionsSource(null, sessionsSchema).source as SessionsSource;

    [
      'client_session_id',
      'last_request_time',
      'project_id',
      'session_insights.title',
      'total_price',
      'turn_count',
    ].forEach((name) => expect(sourceFieldOf(source, name)).toBe(name));
  });

  test('answers null for the Title on the schemaless default, which drops an enrichment-bound optional role', () => {
    expect(sourceFieldOf(defaultSessionsSource(), 'session_insights.title')).toBeNull();
  });
});

describe('roleBoundFields', () => {
  test('lists every bound role field in role order', () => {
    expect(roleBoundFields(customSource)).toEqual(['run_id', 'ended_at', 'summary_title', 'steps']);
  });

  test('lists all six default role fields once the schema reports them', () => {
    expect(roleBoundFields(resolveSessionsSource(null, sessionsSchema).source as SessionsSource)).toEqual([
      'client_session_id',
      'last_request_time',
      'project_id',
      'session_insights.title',
      'total_price',
      'turn_count',
    ]);
  });

  test('lists the default role fields without the Title when no schema is in hand', () => {
    expect(roleBoundFields(defaultSessionsSource())).toEqual([
      'client_session_id',
      'last_request_time',
      'project_id',
      'total_price',
      'turn_count',
    ]);
  });
});

describe('canonicalSessionRow', () => {
  test('copies each bound field onto its canonical name and keeps the original key', () => {
    expect(canonicalSessionRow(customSource, { run_id: 'r-1', ended_at: 9, steps: 4, region: 'eu' })).toEqual({
      run_id: 'r-1',
      client_session_id: 'r-1',
      ended_at: 9,
      last_request_time: 9,
      steps: 4,
      turn_count: 4,
      region: 'eu',
    });
  });

  test('writes nothing for an unbound role', () => {
    const row = canonicalSessionRow(customSource, { run_id: 'r-1', ended_at: 9 });

    expect(row).not.toHaveProperty('project_id');
    expect(row).not.toHaveProperty('total_price');
  });

  test('returns an equal row on the default binding and leaves the input untouched', () => {
    const raw = { client_session_id: 'chat-1', last_request_time: 1, total_price: '0.1' };

    expect(canonicalSessionRow(defaultSessionsSource(), raw)).toEqual(raw);
    expect(canonicalSessionRow(defaultSessionsSource(), raw)).not.toBe(raw);
  });
});
