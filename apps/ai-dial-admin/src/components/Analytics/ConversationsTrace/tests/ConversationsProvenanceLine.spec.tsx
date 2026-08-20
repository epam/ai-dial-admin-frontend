import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationsProvenanceLine from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsProvenanceLine';
import { CONVERSATIONS_ENTITY, FEEDBACK_ENTITY } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';

describe('ConversationsProvenanceLine', () => {
  test('names the real catalog entities rather than generic labels', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.getByText(CONVERSATIONS_ENTITY)).toBeInTheDocument();
    expect(screen.getByText(FEEDBACK_ENTITY)).toBeInTheDocument();
  });

  test('introduces the list from i18n', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.getByText(ConversationsTraceI18nKey.ComposedOver)).toBeInTheDocument();
  });

  test('colours each entity by its provenance, matching the grid band', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.getByText(CONVERSATIONS_ENTITY)).toHaveClass('text-accent-primary');
    expect(screen.getByText(FEEDBACK_ENTITY)).toHaveClass('text-warning');
  });

  // An enrichment is never an entity the page queries: the service exposes its columns through the entity it
  // decorates. So the line names the two tables the queries actually target, while the grid's origin groups —
  // which answer a different question, where a value came from — do distinguish the enrichment.
  test('does not name the insight enrichment, which the page never queries as an entity', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.queryByText('conversation_insights')).not.toBeInTheDocument();
  });

  // A source the page does not query must not be named at all, and nothing here is pending.
  test('names only the entities the page queries, none of them pending', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.queryByText('conversation_summary')).not.toBeInTheDocument();
    expect(screen.getByText(CONVERSATIONS_ENTITY)).not.toHaveAttribute('title');
    expect(screen.getByText(FEEDBACK_ENTITY)).not.toHaveAttribute('title');
  });
});
