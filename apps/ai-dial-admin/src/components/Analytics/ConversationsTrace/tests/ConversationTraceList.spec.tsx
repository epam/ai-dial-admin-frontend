import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ConversationTraceList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceList';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationTraceCard,
  ConversationTraceGroup,
  RatingCounts,
} from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber, formatSignificantCost } from '@/src/utils/analytics/conversation-formatting';

const card = (over: Partial<ConversationTraceCard> = {}): ConversationTraceCard => ({
  traceId: 'trace-1',
  coreSpanId: 'root-1',
  startedAt: Date.UTC(2026, 7, 27, 10, 9, 18),
  durationMs: 12341,
  isSuccess: true,
  responseStatus: 200,
  ownTokens: 0,
  ownPrice: null,
  chainPrice: 0.02895,
  deployment: 'applications/public/pg-chat-hub__1.0.0',
  requestUri: '/openai/deployments/applications/public/pg-chat-hub__1.0.0/chat/completions',
  eventKind: 'llm_call',
  requestMessages: 1,
  hasConversationLabel: true,
  isCoreInternal: false,
  ...over,
});

const group = (over: Partial<ConversationTraceGroup> = {}): ConversationTraceGroup => ({
  traceId: 'trace-1',
  startedAt: Date.UTC(2026, 7, 27, 10, 9, 18),
  spans: 4,
  tokens: 11615,
  price: 0.02895,
  failedSpans: 0,
  chips: [{ eventKind: 'llm_call', spans: 4 }],
  responseIds: [],
  cards: [card()],
  elidedCardCount: 0,
  isRootRecorded: true,
  ...over,
});

const renderList = (props: Partial<ComponentProps<typeof ConversationTraceList>> = {}) =>
  render(
    <ConversationTraceList
      groups={[group()]}
      traceRatings={new Map<string, RatingCounts>()}
      hasMore={false}
      isLoading={false}
      hasLoadError={false}
      onLoadMore={vi.fn()}
      onOpenTrace={vi.fn()}
      {...props}
    />,
  );

describe('ConversationTraceList', () => {
  test('names a card by the deployment its call reached', () => {
    renderList();

    expect(screen.getByText('applications/public/pg-chat-hub__1.0.0')).toBeInTheDocument();
  });

  // A pass-through root records neither a deployment nor an event kind, but does record its endpoint — so the
  // endpoint is the name rather than a placeholder, and the card stays legible without the other two.
  test('names a pass-through card by its request endpoint', () => {
    renderList({
      groups: [
        group({
          cards: [card({ deployment: '', eventKind: '', requestUri: '/claude_code_router/v1/messages' })],
        }),
      ],
    });

    expect(screen.getByText('/claude_code_router/v1/messages')).toBeInTheDocument();
  });

  test('falls back to the trace id when neither a deployment nor an endpoint was recorded', () => {
    renderList({ groups: [group({ cards: [card({ deployment: null, requestUri: null })] })] });

    expect(screen.getAllByText('trace-1').length).toBeGreaterThan(0);
  });

  // Own against chain, so an app that is free itself but spends downstream reads as exactly that.
  test('states a card own spend against its chain spend', () => {
    renderList();

    // Asserted through the shared formatter rather than a literal, so the test states the pair and not the
    // currency formatting, which has its own tests. Both halves are labelled, so neither can be read as the
    // other or as a trace figure.
    const own = screen.getByText(ConversationsTraceI18nKey.TraceCardOwnPrice).parentElement;
    const chain = screen.getByText(ConversationsTraceI18nKey.TraceCardChainPrice).parentElement;

    expect(own).toHaveTextContent(UNAVAILABLE_VALUE);
    expect(chain).toHaveTextContent(formatSignificantCost(0.02895));
  });

  test('states a card own duration and message count', () => {
    renderList();

    expect(screen.getByText(/12\.3s/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(ConversationsTraceI18nKey.TraceCardMessages))).toBeInTheDocument();
  });

  test('states a failed card own status and its response code', () => {
    renderList({ groups: [group({ cards: [card({ isSuccess: false, responseStatus: 502 })] })] });

    expect(screen.getByText(/502/)).toBeInTheDocument();
  });

  // A trace failing elsewhere is a trace-level fact and must not be presented as this card's own status.
  test('keeps a card own status when another hop in its trace failed', () => {
    renderList({ groups: [group({ failedSpans: 2, cards: [card({ isSuccess: true })] })] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceCardSucceeded)).toBeInTheDocument();
  });

  test('renders one card per recorded root of a trace', () => {
    renderList({
      groups: [
        group({
          cards: [
            card({ coreSpanId: 'client', deployment: 'pg-chat-hub' }),
            card({ coreSpanId: 'service', deployment: 'gpt-4.1-nano', isCoreInternal: true }),
          ],
        }),
      ],
    });

    expect(screen.getByText('pg-chat-hub')).toBeInTheDocument();
    expect(screen.getByText('gpt-4.1-nano')).toBeInTheDocument();
  });

  test('marks a Core-internal card as such', () => {
    renderList({ groups: [group({ cards: [card({ isCoreInternal: true })] })] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceCardCoreInternal)).toBeInTheDocument();
  });

  test('does not mark a card recorded under the conversation own project', () => {
    renderList();

    expect(screen.queryByText(ConversationsTraceI18nKey.TraceCardCoreInternal)).toBeNull();
  });

  // No body-derived content at all: that is what lets the listing render without a body read, so a body read
  // that fails cannot empty it.
  test('states no message text and no turn number', () => {
    renderList();

    expect(screen.queryByText(/Turn \d/)).toBeNull();
  });

  test('reports a trace whose root was not recorded, from its own figures', () => {
    renderList({ groups: [group({ isRootRecorded: false, cards: [] })] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceRootNotRecorded)).toBeInTheDocument();
    // Its figures are real even though its root is not.
    expect(screen.getByText(formatCompactNumber(11615))).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(ConversationsTraceI18nKey.TraceRootNotRecorded) }),
    ).toBeInTheDocument();
  });

  // Capped, but never in silence: the trace own figures are not capped with its cards, so the remainder has
  // to be stated or the totals stop reconciling with what is on screen.
  test('discloses how many further calls a capped trace records', () => {
    renderList({ groups: [group({ elidedCardCount: 81 })] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceFurtherCalls, { exact: false })).toBeInTheDocument();
  });

  test('discloses nothing when every card of a trace is shown', () => {
    renderList();

    expect(screen.queryByText(ConversationsTraceI18nKey.TraceFurtherCalls, { exact: false })).toBeNull();
  });

  test('opens the trace of the card that was activated', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    const only = group();
    renderList({ groups: [only], onOpenTrace });

    await user.click(screen.getByText('applications/public/pg-chat-hub__1.0.0'));

    expect(onOpenTrace).toHaveBeenCalledWith(only, only.cards[0]);
  });

  test('activates a card from the keyboard', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    renderList({ onOpenTrace });

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onOpenTrace).toHaveBeenCalled();
  });

  test('states a card ratings where they resolve', () => {
    renderList({ traceRatings: new Map([['trace-1', { rating_up: 3, rating_down: 1 }]]) });

    // The counts are unlabelled digits on screen; their accessible names are what identify them, so those
    // are what the test queries by.
    expect(screen.getByText(ConversationsTraceI18nKey.RatingUpTotal).parentElement).toHaveTextContent('3');
    expect(screen.getByText(ConversationsTraceI18nKey.RatingDownTotal).parentElement).toHaveTextContent('1');
  });

  test('states that no traces were recorded, distinctly from a failed read', () => {
    renderList({ groups: [] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceListEmptyHintLive)).toBeInTheDocument();
  });

  test('reports a failed read as a failure rather than as an empty listing', () => {
    renderList({ groups: [], hasLoadError: true });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceListLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeNull();
  });

  test('states nothing about emptiness while the first page is still loading', () => {
    renderList({ groups: [], isLoading: true });

    expect(screen.queryByText(ConversationsTraceI18nKey.TraceListEmpty)).toBeNull();
  });

  test('reports a failed later page while keeping the traces already loaded', () => {
    renderList({ hasLoadError: true });

    expect(screen.getByText('applications/public/pg-chat-hub__1.0.0')).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceListLoadFailedHint)).toBeInTheDocument();
  });
});

// Trace-as-group, root-as-card. A trace recording one client call is the overwhelming majority, so the
// grouping only becomes visible where a trace genuinely records more than one.
describe('ConversationTraceList — grouping', () => {
  const twoCardGroup = () =>
    group({
      cards: [
        card({ coreSpanId: 'client', deployment: 'pg-chat-hub' }),
        card({ coreSpanId: 'service', deployment: 'gpt-4.1-nano', isCoreInternal: true }),
      ],
    });

  test('collapses a single-root trace into one row with no grouping affordance', () => {
    renderList();

    expect(screen.queryByRole('group')).toBeNull();
  });

  test('groups a trace that records more than one call', () => {
    renderList({ groups: [twoCardGroup()] });

    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  // Colour and indentation alone would not expose the distinction, so the group carries its own name.
  test('names each group by its trace, for assistive technology', () => {
    renderList({ groups: [twoCardGroup()] });

    expect(screen.getByRole('group', { name: ConversationsTraceI18nKey.TraceGroupLabel })).toBeInTheDocument();
  });

  test('states the trace own figures once, above its cards', () => {
    renderList({ groups: [twoCardGroup()] });

    const traceGroup = screen.getByRole('group');

    expect(traceGroup).toHaveTextContent(String(formatCompactNumber(4)));
    expect(traceGroup).toHaveTextContent('pg-chat-hub');
    expect(traceGroup).toHaveTextContent('gpt-4.1-nano');
  });

  test('states the chips a trace recorded, with their counts', () => {
    renderList({
      groups: [
        group({
          chips: [
            { eventKind: 'llm_call', spans: 5 },
            { eventKind: '', spans: 1 },
          ],
        }),
      ],
    });

    expect(screen.getByText(/Llm call/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(ConversationsTraceI18nKey.TraceChipUnclassified))).toBeInTheDocument();
  });

  test('states that a trace contains failures without changing a card own status', () => {
    renderList({ groups: [group({ failedSpans: 2 })] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceFailuresInside, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceCardSucceeded)).toBeInTheDocument();
  });

  test('groups a capped trace so its disclosure sits with the cards it belongs to', () => {
    renderList({ groups: [group({ elidedCardCount: 81 })] });

    const traceGroup = screen.getByRole('group');

    expect(traceGroup).toHaveTextContent(ConversationsTraceI18nKey.TraceFurtherCalls);
  });
});

// The tier a value lands in is the register it belongs to: the middle tier is card-level, read from the
// card's own root row, and the bottom tier is trace-level, read from the figures query. These assert that
// placement — not how any of it is styled — because a value drifting between tiers is a value changing what
// it claims to be.
describe('ConversationTraceList — tiers', () => {
  test('states the card own facts in the middle tier, each labelled', () => {
    renderList();

    for (const label of [
      ConversationsTraceI18nKey.TraceCardStarted,
      ConversationsTraceI18nKey.TraceCardMessages,
      ConversationsTraceI18nKey.TraceCardOwnTokens,
      ConversationsTraceI18nKey.TraceCardOwnPrice,
      ConversationsTraceI18nKey.TraceCardChainPrice,
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test('keeps the card own tokens out of the trace tier', () => {
    renderList({ groups: [group({ tokens: 11615, cards: [card({ ownTokens: 0 })] })] });

    const ownTokens = screen.getByText(ConversationsTraceI18nKey.TraceCardOwnTokens).parentElement;

    expect(ownTokens).toHaveTextContent('0');
    expect(ownTokens).not.toHaveTextContent(formatCompactNumber(11615));
  });

  test('states the trace span count in the bottom tier', () => {
    renderList({ groups: [group({ spans: 7 })] });

    expect(screen.getByText(ConversationsTraceI18nKey.TraceCardSpans, { exact: false })).toBeInTheDocument();
  });

  test('names the rule the listing follows, without calling a card a turn', () => {
    renderList();

    expect(screen.getByRole('heading', { name: ConversationsTraceI18nKey.TraceSectionTitle })).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.TraceSectionRule)).toBeInTheDocument();
    expect(screen.queryByText(/Turn \d/)).toBeNull();
  });

  // A single-root trace is one panel whose bottom tier carries the trace register; a multi-root trace states
  // that register once at panel level rather than repeating it per card.
  test('carries the trace tier once, whether collapsed or grouped', () => {
    const { unmount } = renderList();

    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceCardSpans, { exact: false })).toHaveLength(1);
    unmount();

    renderList({
      groups: [
        group({
          cards: [card({ coreSpanId: 'client' }), card({ coreSpanId: 'service', isCoreInternal: true })],
        }),
      ],
    });

    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceCardSpans, { exact: false })).toHaveLength(1);
    expect(screen.getAllByText(ConversationsTraceI18nKey.TraceCardStarted)).toHaveLength(2);
  });

  // Ratings are a trace fact, so a Core service call inside the same trace must not display the reader's
  // rating of the conversation's own answer.
  test('attaches the trace ratings only to the card carrying the conversation label', () => {
    renderList({
      groups: [
        group({
          cards: [
            card({ coreSpanId: 'client', hasConversationLabel: true }),
            card({ coreSpanId: 'service', hasConversationLabel: false, isCoreInternal: true }),
          ],
        }),
      ],
      traceRatings: new Map([['trace-1', { rating_up: 3, rating_down: 0 }]]),
    });

    expect(screen.getAllByText(ConversationsTraceI18nKey.RatingUpTotal)).toHaveLength(1);
  });

  test('opens a trace whose root was not recorded, rather than rendering it inert', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    const only = group({ isRootRecorded: false, cards: [] });
    renderList({ groups: [only], onOpenTrace });

    await user.click(screen.getByRole('button', { name: new RegExp(ConversationsTraceI18nKey.TraceRootNotRecorded) }));

    expect(onOpenTrace).toHaveBeenCalledWith(only);
  });

  test('states that it is loading rather than rendering an empty panel', () => {
    renderList({ groups: [], isLoading: true });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('offers a manual way to load the next page when more remain', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    renderList({ hasMore: true, onLoadMore });

    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.TraceListLoadMore }));

    expect(onLoadMore).toHaveBeenCalled();
  });
});

// An `aria-label` on a button replaces its name-from-content, so labelling a card with its title alone would
// leave a screen reader with the name and nothing else — no status, no figures, no marker, no chips. The
// listing carries no such label, and this asserts the consequence rather than the attribute.
describe('ConversationTraceList — accessible naming', () => {
  test('names a card by everything it states, not by its title alone', () => {
    renderList({ groups: [group({ failedSpans: 0, cards: [card({ isCoreInternal: true })] })] });

    const name = screen.getByRole('button').getAttribute('aria-label') ?? screen.getByRole('button').textContent ?? '';

    expect(name).toContain('applications/public/pg-chat-hub__1.0.0');
    expect(name).toContain(ConversationsTraceI18nKey.TraceCardSucceeded);
    expect(name).toContain(ConversationsTraceI18nKey.TraceCardCoreInternal);
    expect(name).toContain(ConversationsTraceI18nKey.TraceCardOwnPrice);
  });
});
