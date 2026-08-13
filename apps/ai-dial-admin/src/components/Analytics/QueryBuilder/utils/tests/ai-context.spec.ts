import { describe, expect, test } from 'vitest';

import { buildSchemaSystemMessage } from '@/src/components/Analytics/QueryBuilder/utils/ai-context';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryAssistantRole } from '@/src/models/analytics/query-assistant';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' },
  {
    name: 'project_id',
    type: AnalyticsFieldType.String,
    source: 'project_id',
    display_name: 'Project',
    description: 'Owning project of the request',
  },
  { name: 'user_email', type: AnalyticsFieldType.String, source: 'user_email', sensitive: true },
];

const build = (entityName = 'dial_usage_log', fields = FIELDS) => buildSchemaSystemMessage(entityName, fields);

describe('buildSchemaSystemMessage', () => {
  test('is a system message, so it never reads as a user turn', () => {
    expect(build().role).toBe(QueryAssistantRole.System);
  });

  test('names the selected source', () => {
    expect(build().content).toContain('"dial_usage_log"');
  });

  test('states the source as a preference rather than a constraint', () => {
    expect(build().content).toContain('Prefer it unless');
  });

  test('lists each column with its type', () => {
    const { content } = build();

    expect(content).toContain('- request_time (timestamp)');
    expect(content).toContain('- project_id (string)');
  });

  test('includes the display name and description a schema defines', () => {
    expect(build().content).toContain('- project_id (string) — Project; Owning project of the request');
  });

  test('omits a display name that merely repeats the column name', () => {
    const fields: AnalyticsEntityField[] = [
      { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', display_name: 'project_id' },
    ];

    const lines = build('dial_usage_log', fields).content.split('\n');
    expect(lines.filter((line) => line.startsWith('- '))).toEqual(['- project_id (string)']);
  });

  test('marks a sensitive column so the assistant avoids an unsavable comparison', () => {
    expect(build().content).toContain('- user_email (string) — sensitive: do not compare to a literal value');
  });

  test('carries no row data — only names, types, and schema labels', () => {
    const { content } = build();

    content
      .split('\n')
      .filter((line) => line.startsWith('- '))
      .forEach((line) => expect(line).toMatch(/^- \w+ \(\w+\)/));
  });

  test('says the column list is unavailable rather than inventing columns', () => {
    const { content } = build('dial_usage_log', []);

    expect(content).toContain('column list is unavailable');
    expect(content).not.toContain('- ');
  });

  test('produces the same message for the same schema', () => {
    expect(build().content).toBe(build().content);
  });

  test('keeps the schema field order', () => {
    const { content } = build();

    expect(content.indexOf('request_time')).toBeLessThan(content.indexOf('project_id'));
  });
});
