import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationsProvenanceLine from '@/src/components/Analytics/ConversationsTrace/Header/ConversationsProvenanceLine';
import {
  CONVERSATIONS_ENTITY,
  CONVERSATION_SUMMARY_ENRICHMENT,
  FEEDBACK_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
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

  test('lists the enrichment when it is switched on', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.getByText(CONVERSATION_SUMMARY_ENRICHMENT)).toHaveClass('text-accent-secondary');
  });

  // The enrichment is not registered, so the line must not present it as a live source.
  test('marks the enrichment as not yet registered', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.getByTitle(ConversationsTraceI18nKey.EntityPending)).toBeInTheDocument();
  });

  test('marks only the enrichment as pending, not the source tables', () => {
    render(<ConversationsProvenanceLine />);

    expect(screen.getAllByTitle(ConversationsTraceI18nKey.EntityPending)).toHaveLength(1);
    expect(screen.getByText(CONVERSATIONS_ENTITY)).not.toHaveAttribute('title');
    expect(screen.getByText(FEEDBACK_ENTITY)).not.toHaveAttribute('title');
  });
});
