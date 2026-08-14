import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryAssistantMessage, QueryAssistantRole } from '@/src/models/analytics/query-assistant';

const SENSITIVE_NOTE = 'sensitive: do not compare to a literal value';

const fieldLine = (field: AnalyticsEntityField): string => {
  const notes: string[] = [];
  if (field.display_name && field.display_name !== field.name) notes.push(field.display_name);
  if (field.description) notes.push(field.description);
  if (field.sensitive) notes.push(SENSITIVE_NOTE);

  const suffix = notes.length ? ` — ${notes.join('; ')}` : '';
  return `- ${field.name} (${field.type})${suffix}`;
};

export const buildSchemaSystemMessage = (entityName: string, fields: AnalyticsEntityField[]): QueryAssistantMessage => {
  const lines: string[] = [];

  if (entityName) {
    lines.push(
      `The user is building a query against the "${entityName}" entity. Prefer it unless the request ` +
        `clearly names another source.`,
    );
  }

  if (fields.length) {
    lines.push('', `Columns of "${entityName}":`, ...fields.map(fieldLine));
  } else {
    lines.push('', 'Its column list is unavailable, so avoid naming specific columns.');
  }

  return { role: QueryAssistantRole.System, content: lines.join('\n') };
};
