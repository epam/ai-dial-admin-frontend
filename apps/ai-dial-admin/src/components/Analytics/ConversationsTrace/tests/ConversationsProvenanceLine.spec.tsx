import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationsProvenanceLine from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsProvenanceLine';
import { CONVERSATIONS_ENTITY, FEEDBACK_ENTITY } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

const field = (name: string): AnalyticsEntityField => ({
  name,
  type: AnalyticsFieldType.String,
  source: name.includes('.') ? name.slice(name.indexOf('.') + 1) : name,
});

const SCHEMA: AnalyticsEntityField[] = [
  field('chat_id'),
  field('conversation_insights.title'),
  field('conversation_insights.summary'),
  field('conversation_buckets.turn_bucket'),
];

describe('ConversationsProvenanceLine', () => {
  test('introduces the list from i18n', () => {
    render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);

    expect(screen.getByText(ConversationsTraceI18nKey.ComposedOver)).toBeInTheDocument();
  });

  test('names the real catalog entities rather than generic labels', () => {
    render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);

    expect(screen.getByText(CONVERSATIONS_ENTITY)).toBeInTheDocument();
    expect(screen.getByText(FEEDBACK_ENTITY)).toBeInTheDocument();
  });

  test('names every enrichment namespace the fetched schema reports', () => {
    render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);

    expect(screen.getByText('conversation_insights')).toBeInTheDocument();
    expect(screen.getByText('conversation_buckets')).toBeInTheDocument();
  });

  test('names an enrichment once however many of its fields the schema reports', () => {
    render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);

    expect(screen.getAllByText('conversation_insights')).toHaveLength(1);
  });

  test('lists the base entity first, then the enrichments in first-appearance order', () => {
    const { container } = render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);
    const names = Array.from(container.querySelectorAll('span.font-mono')).map((node) => node.textContent);

    expect(names).toEqual([CONVERSATIONS_ENTITY, 'conversation_insights', 'conversation_buckets', FEEDBACK_ENTITY]);
  });

  test('colours each entity by its provenance, matching the grid band', () => {
    render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);

    expect(screen.getByText(CONVERSATIONS_ENTITY)).toHaveClass('text-accent-primary');
    expect(screen.getByText('conversation_insights')).toHaveClass('text-accent-secondary');
    expect(screen.getByText(FEEDBACK_ENTITY)).toHaveClass('text-warning');
  });

  // The unattributed colour is what its columns get in the grid band, so the two cannot disagree.
  test('names an enrichment it cannot label, under the unattributed colour', () => {
    render(<ConversationsProvenanceLine schemaFields={[field('some_future_enrichment.value')]} />);

    expect(screen.getByText('some_future_enrichment')).toHaveClass('text-secondary');
  });

  // The case design D4 anticipates: ratings arrive as an enrichment, the schema reports the namespace and
  // QUERIED_SOURCE_ENTITIES still names the table. Listed twice it would also duplicate a React key, which
  // the globally silenced console.error would hide.
  test('names an entity once when the schema and the queried list both report it', () => {
    const { container } = render(
      <ConversationsProvenanceLine schemaFields={[field(`${FEEDBACK_ENTITY}.rate_pos_count`)]} />,
    );
    const names = Array.from(container.querySelectorAll('span.font-mono')).map((node) => node.textContent);

    expect(names.filter((name) => name === FEEDBACK_ENTITY)).toHaveLength(1);
    expect(names).toEqual([CONVERSATIONS_ENTITY, FEEDBACK_ENTITY]);
  });

  test('names the base entity alone when the schema reports no enrichment', () => {
    const { container } = render(<ConversationsProvenanceLine schemaFields={[field('chat_id')]} />);
    const names = Array.from(container.querySelectorAll('span.font-mono')).map((node) => node.textContent);

    expect(names).toEqual([CONVERSATIONS_ENTITY, FEEDBACK_ENTITY]);
  });

  test('falls back to the queried entities when no schema was fetched', () => {
    const { container } = render(<ConversationsProvenanceLine schemaFields={null} />);
    const names = Array.from(container.querySelectorAll('span.font-mono')).map((node) => node.textContent);

    expect(names).toEqual([CONVERSATIONS_ENTITY, FEEDBACK_ENTITY]);
  });

  // A source the page does not query must not be named at all, and nothing here is pending.
  test('names only real entities, none of them marked pending', () => {
    render(<ConversationsProvenanceLine schemaFields={SCHEMA} />);

    expect(screen.queryByText('conversation_summary')).not.toBeInTheDocument();
    expect(screen.getByText(CONVERSATIONS_ENTITY)).not.toHaveAttribute('title');
    expect(screen.getByText(FEEDBACK_ENTITY)).not.toHaveAttribute('title');
  });
});
