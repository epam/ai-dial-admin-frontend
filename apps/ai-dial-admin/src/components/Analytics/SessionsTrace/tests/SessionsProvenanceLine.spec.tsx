import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SessionsProvenanceLine from '@/src/components/Analytics/SessionsTrace/Header/SessionsProvenanceLine';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

const BASE_TABLE = 'sessions';
const RATINGS = 'session_ratings';

const field = (name: string): AnalyticsEntityField => ({
  name,
  type: AnalyticsFieldType.String,
  source: name.includes('.') ? name.slice(name.indexOf('.') + 1) : name,
});

const SCHEMA: AnalyticsEntityField[] = [
  field('chat_id'),
  field('session_insights.title'),
  field('session_insights.summary'),
  field(`${RATINGS}.rate_pos_count`),
  field(`${RATINGS}.rate_zero_count`),
  field(`${RATINGS}.rate_neg_count`),
  field('conversation_buckets.turn_bucket'),
];

const renderLine = (schemaFields: AnalyticsEntityField[] | null = SCHEMA, baseTable = BASE_TABLE) =>
  render(<SessionsProvenanceLine baseTable={baseTable} schemaFields={schemaFields} />);

const entityNames = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('span.font-mono')).map((node) => node.textContent);

describe('SessionsProvenanceLine', () => {
  test('introduces the list from i18n', () => {
    renderLine();

    expect(screen.getByText(SessionsTraceI18nKey.ComposedOver)).toBeInTheDocument();
  });

  test('names the configured base table', () => {
    const { container } = renderLine([field('run_key')], 'agent_runs');

    expect(entityNames(container)).toEqual(['agent_runs']);
  });

  test('names every enrichment namespace the fetched schema reports', () => {
    renderLine();

    expect(screen.getByText('session_insights')).toBeInTheDocument();
    expect(screen.getByText(RATINGS)).toBeInTheDocument();
    expect(screen.getByText('conversation_buckets')).toBeInTheDocument();
  });

  test('names an enrichment once however many of its fields the schema reports', () => {
    renderLine();

    expect(screen.getAllByText('session_insights')).toHaveLength(1);
  });

  test('lists the base table first, then the enrichments in first-appearance order', () => {
    const { container } = renderLine();

    expect(entityNames(container)).toEqual([BASE_TABLE, 'session_insights', RATINGS, 'conversation_buckets']);
  });

  test('colours each entity by its provenance, matching the grid band', () => {
    renderLine();

    expect(screen.getByText(BASE_TABLE)).toHaveClass('text-accent-primary');
    expect(screen.getByText('session_insights')).toHaveClass('text-accent-secondary');
    expect(screen.getByText(RATINGS)).toHaveClass('text-warning');
    expect(screen.getByText('conversation_buckets')).toHaveClass('text-accent-tertiary');
  });

  test('colours enrichments by position rather than by name', () => {
    renderLine([field('some_future_enrichment.value'), field('session_insights.title')]);

    expect(screen.getByText('some_future_enrichment')).toHaveClass('text-accent-secondary');
    expect(screen.getByText('session_insights')).toHaveClass('text-accent-tertiary');
  });

  test('names an enrichment past the palette under the unattributed colour', () => {
    renderLine(['a', 'b', 'c', 'd'].map((namespace) => field(`${namespace}.value`)));

    expect(screen.getByText('d')).toHaveClass('text-secondary');
  });

  test('names the base table alone when the schema reports no enrichment', () => {
    const { container } = renderLine([field('chat_id')]);

    expect(entityNames(container)).toEqual([BASE_TABLE]);
  });

  test('names the base table alone when no schema was fetched', () => {
    const { container } = renderLine(null);

    expect(entityNames(container)).toEqual([BASE_TABLE]);
  });

  test('names only real entities, none of them marked pending', () => {
    renderLine();

    expect(screen.queryByText('conversation_summary')).not.toBeInTheDocument();
    expect(screen.getByText(BASE_TABLE)).not.toHaveAttribute('title');
  });
});
