import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EntityTraceListing from '@/src/components/Analytics/EntityTraces/EntityTraceListing';
import { ButtonsI18nKey, EntityTracesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { SessionTraceCard, SessionTraceGroup } from '@/src/models/analytics/sessions-trace';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';

const isForbiddenMock = vi.fn();
const getEntityTracePage = vi.fn();
const getSessionSpans = vi.fn();

vi.mock('@/src/app/[lang]/dashboards/actions', () => ({
  getIsAnalyticsForbidden: () => isForbiddenMock(),
}));

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getEntityTracePage: (...args: unknown[]) => getEntityTracePage(...args),
  getSessionSpans: (...args: unknown[]) => getSessionSpans(...args),
  getHopBodyGrants: () =>
    Promise.resolve({ success: true, response: { isRequestReadable: true, isResponseReadable: true } }),
}));

// The trace view reads every hop body of its own; what this listing owes it is the trace and the span it opens on.
const traceViewPropsSpy = vi.fn();
vi.mock('@/src/components/Analytics/SessionsTrace/Detail/SessionTraceView', () => ({
  default: (props: { selectedSpanId: string | null; onClose: () => void }) => {
    traceViewPropsSpy(props);
    return (
      <section aria-label="trace view">
        <button type="button" onClick={props.onClose}>
          back
        </button>
      </section>
    );
  },
}));

const card = (over: Partial<SessionTraceCard> = {}): SessionTraceCard => ({
  traceId: 't1',
  coreSpanId: 'model-call',
  startedAt: 5000,
  durationMs: 1200,
  isSuccess: true,
  responseStatus: 200,
  ownTokens: 40,
  ownPrice: 0.01,
  chainPrice: 0.02,
  deployment: 'a-model',
  requestUri: '/openai/deployments/a-model/chat/completions',
  eventKind: 'llm_call',
  requestMessages: 2,
  hasSessionLabel: false,
  isCoreInternal: false,
  caller: 'an-app',
  projectId: 'a-project',
  ...over,
});

const group = (over: Partial<SessionTraceGroup> = {}): SessionTraceGroup => ({
  traceId: 't1',
  startedAt: 5000,
  spans: 4,
  tokens: 100,
  price: 0.05,
  failedSpans: 0,
  chips: [],
  responseIds: [],
  cards: [card()],
  elidedCardCount: 0,
  isRootRecorded: true,
  ...over,
});

const page = (groups: SessionTraceGroup[]) => ({
  success: true,
  response: { groups, hasMore: false, cursor: null },
});

const MODEL = { name: 'a-model' } as BaseEntity;

const renderListing = (entity: BaseEntity = MODEL, route = ApplicationRoute.Models) =>
  render(<EntityTraceListing route={route} entity={entity} />);

beforeEach(() => {
  vi.clearAllMocks();
  isForbiddenMock.mockResolvedValue(false);
  getEntityTracePage.mockResolvedValue(page([group()]));
  getSessionSpans.mockResolvedValue({
    success: true,
    response: {
      spans: [
        { core_span_id: 'root', core_parent_span_id: null, request_time: 1000, operation_duration_ms: 4000 },
        { core_span_id: 'model-call', core_parent_span_id: 'root', request_time: 2000, operation_duration_ms: 1200 },
      ],
      fieldGroups: [],
    },
  });
});

describe('EntityTraceListing', () => {
  test('lists the calls to the entity under its own heading', async () => {
    renderListing();

    expect(await screen.findByRole('heading', { name: EntityTracesI18nKey.Title })).toBeInTheDocument();
    expect(screen.getByText('an-app')).toBeInTheDocument();
    expect(getEntityTracePage).toHaveBeenCalledWith(
      ApplicationRoute.Models,
      'a-model',
      expect.any(Number),
      expect.any(Number),
      null,
    );
  });

  test('renders the period control and Refresh', async () => {
    renderListing();

    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Refresh })).toBeInTheDocument();
  });

  test('opens a card into its trace with the call selected, and returns to the listing', async () => {
    const user = userEvent.setup();
    renderListing();

    await user.click(await screen.findByRole('button', { name: /a-model/ }));

    expect(await screen.findByRole('region', { name: 'trace view' })).toBeInTheDocument();
    expect(getSessionSpans).toHaveBeenCalledWith('t1');
    expect(traceViewPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ selectedSpanId: 'model-call' }));
    // The header sits the trace's duration beside the trace's tokens and cost, not the one call's.
    expect(traceViewPropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ figures: expect.objectContaining({ durationMs: 4000, price: 0.05 }) }),
    );

    await user.click(screen.getByRole('button', { name: 'back' }));

    expect(await screen.findByText('an-app')).toBeVisible();
    expect(getEntityTracePage).toHaveBeenCalledOnce();
  });
});

describe('EntityTraceListing — states', () => {
  test('renders the no-access state for a refused user', async () => {
    isForbiddenMock.mockResolvedValue(true);
    renderListing();

    expect(await screen.findByText(ErrorI18nKey.AccessForbidden)).toBeInTheDocument();
    expect(getEntityTracePage).not.toHaveBeenCalled();
  });

  test('renders the no-access state when a page read is refused after the access check passed', async () => {
    getEntityTracePage.mockResolvedValueOnce({ success: false, status: 403 });
    renderListing();

    expect(await screen.findByText(ErrorI18nKey.AccessForbidden)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: EntityTracesI18nKey.Retry })).toBeNull();
  });

  test('states that an entity with no name to match has no calls it can be matched by', async () => {
    renderListing({ name: '' } as BaseEntity);

    expect(await screen.findByText(EntityTracesI18nKey.UnmatchedTitle)).toBeInTheDocument();
    expect(getEntityTracePage).not.toHaveBeenCalled();
  });

  test('states and announces an empty period', async () => {
    getEntityTracePage.mockResolvedValue(page([]));
    renderListing();

    expect(await screen.findByText(EntityTracesI18nKey.EmptyHint)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(EntityTracesI18nKey.EmptyTitle);
  });

  test('offers a retry when the first page fails', async () => {
    const user = userEvent.setup();
    getEntityTracePage.mockResolvedValueOnce({ success: false });
    renderListing();

    await user.click(await screen.findByRole('button', { name: EntityTracesI18nKey.Retry }));

    expect(await screen.findByText('an-app')).toBeInTheDocument();
    expect(getEntityTracePage).toHaveBeenCalledTimes(2);
  });
});
