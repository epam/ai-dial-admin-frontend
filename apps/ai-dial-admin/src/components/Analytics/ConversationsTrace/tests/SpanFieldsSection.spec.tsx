import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import SpanFieldsSection from '@/src/components/Analytics/ConversationsTrace/Detail/SpanFieldsSection';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { SpanFieldGroup, SpanFieldRow, SpanFieldTag } from '@/src/models/analytics/conversations-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';

const IDENTITY: SpanFieldGroup = {
  tag: SpanFieldTag.Identifier,
  fields: [
    { name: 'core_span_id', label: 'Span ID', type: AnalyticsFieldType.String, tag: SpanFieldTag.Identifier },
    { name: 'event_id', label: 'Event ID', type: AnalyticsFieldType.Uuid, tag: SpanFieldTag.Identifier },
  ],
};

const TOKENS: SpanFieldGroup = {
  tag: SpanFieldTag.TokenUsage,
  fields: [
    {
      name: 'reasoning_tokens',
      label: 'Reasoning tokens',
      type: AnalyticsFieldType.Long,
      tag: SpanFieldTag.TokenUsage,
    },
  ],
};

const CLIENT: SpanFieldGroup = {
  tag: SpanFieldTag.Client,
  fields: [
    {
      name: 'usage_client_identity.client_type',
      label: 'Client type',
      type: AnalyticsFieldType.String,
      tag: SpanFieldTag.Client,
    },
  ],
};

const ROW = {
  core_span_id: 's1',
  event_id: null,
  reasoning_tokens: 140,
  total_tokens: 7512,
  'usage_client_identity.client_type': 'chat',
} as unknown as SpanFieldRow;

const renderSection = (groups: SpanFieldGroup[] = [IDENTITY, TOKENS, CLIENT], row: SpanFieldRow = ROW) =>
  render(<SpanFieldsSection groups={groups} row={row} />);

const headerFor = (labelKey: string) => screen.getByRole('button', { name: new RegExp(labelKey) });

describe('SpanFieldsSection', () => {
  test('names each group by the label this release has for its tag', () => {
    renderSection();

    expect(headerFor(ConversationsTraceI18nKey.SpanTagIdentifier)).toBeInTheDocument();
    expect(headerFor(ConversationsTraceI18nKey.SpanTagClient)).toBeInTheDocument();
  });

  // The catalog gains tags without asking this console, so an unlabelled one is presented under its own
  // spelling rather than hidden or renamed.
  test('names a tag this release has no words for by the tag itself', () => {
    renderSection([{ ...CLIENT, tag: 'brand-new-tag', fields: [{ ...CLIENT.fields[0], tag: 'brand-new-tag' }] }]);

    expect(screen.getByRole('button', { name: /Brand new tag/ })).toBeInTheDocument();
  });

  // Every field the schema declares for the group, recorded or not: a dash says the hop did not record it,
  // while a missing row leaves the reader checking the schema to know whether the column exists.
  test('reveals every field the group declares on opening it, absent ones included', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(headerFor(ConversationsTraceI18nKey.SpanTagIdentifier));

    expect(screen.getByText('Span ID')).toBeInTheDocument();
    expect(screen.getByText('Event ID')).toBeInTheDocument();
    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
  });

  test('states a revealed field under its own label, with the value the log recorded', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(headerFor(ConversationsTraceI18nKey.SpanTagIdentifier));

    expect(screen.getByText('Span ID')).toBeInTheDocument();
    expect(screen.getByText('s1')).toBeInTheDocument();
  });

  // A group with no column named for its tag previews its first recorded value, so a reader scanning the
  // rail can tell a group worth opening from one whose answer they already have.
  test('previews the first recorded value of a collapsed group', () => {
    renderSection();

    expect(headerFor(ConversationsTraceI18nKey.SpanTagClient)).toHaveAccessibleName(/chat/);
  });

  test('drops the preview once the group is open, where the value is the first row', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(headerFor(ConversationsTraceI18nKey.SpanTagClient));

    expect(headerFor(ConversationsTraceI18nKey.SpanTagClient)).toHaveAccessibleName(
      ConversationsTraceI18nKey.SpanTagClient,
    );
    expect(screen.getByText('Client type')).toBeInTheDocument();
  });

  // No count and no marker: the group's name and the preview are its whole statement.
  test('states no field count in the header', () => {
    renderSection();

    expect(headerFor(ConversationsTraceI18nKey.SpanTagIdentifier)).not.toHaveAccessibleName(/\d+ *\/ *\d+/);
  });

  // Fields arrive sorted by name inside a tag, so Token usage would otherwise lead with a cache count.
  test('previews a figure group by the column named for it, not by its first field', () => {
    renderSection();

    expect(headerFor(ConversationsTraceI18nKey.SpanTagTokenUsage)).toHaveAccessibleName(/7,512/);
  });

  test('states no description under a field', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(headerFor(ConversationsTraceI18nKey.SpanTagIdentifier));

    expect(screen.queryByText('The hop’s own span id.')).toBeNull();
  });

  test('keeps one group open at a time', async () => {
    const user = userEvent.setup();
    renderSection();
    const identity = headerFor(ConversationsTraceI18nKey.SpanTagIdentifier);
    const client = headerFor(ConversationsTraceI18nKey.SpanTagClient);

    await user.click(identity);
    await user.click(client);

    expect(client).toHaveAttribute('aria-expanded', 'true');
    expect(identity).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes a group when its own header is clicked again', async () => {
    const user = userEvent.setup();
    renderSection();
    const identity = headerFor(ConversationsTraceI18nKey.SpanTagIdentifier);

    await user.click(identity);
    await user.click(identity);

    expect(identity).toHaveAttribute('aria-expanded', 'false');
  });

  // Dropping the group would take its header out of the tab order and make the rail's structure change
  // under a reader moving down the tree.
  test('keeps a group this span recorded nothing for listed, with its fields dashed', async () => {
    const user = userEvent.setup();
    renderSection([IDENTITY], { core_span_id: null, event_id: null } as unknown as SpanFieldRow);

    await user.click(headerFor(ConversationsTraceI18nKey.SpanTagIdentifier));

    expect(screen.getByText('Span ID')).toBeInTheDocument();
    expect(screen.getAllByText(UNAVAILABLE_VALUE)).toHaveLength(2);
  });

  // A CSS-level assertion, because the failure it guards against is invisible to jsdom: the section is a
  // bounded flex column, so a group that shrinks gives up its height and its open content collapses to
  // nothing while the header stays.
  test('keeps every group from shrinking inside the bounded section', () => {
    const { container } = renderSection();

    expect(container.querySelectorAll('.shrink-0').length).toBeGreaterThanOrEqual(2);
  });

  test('states why it has no groups when the schema could not be read', () => {
    renderSection([]);

    expect(screen.getByText(ConversationsTraceI18nKey.SpanFieldsUnavailable)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
