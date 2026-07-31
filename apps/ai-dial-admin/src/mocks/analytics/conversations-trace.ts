// Temporary stand-in for a backend with no conversation rollups yet. Everything that dies with the
// mock lives here — deleting this file and the one import in `actions.ts` removes it entirely.
// Deliberately untested and deliberately outside `utils/`: fixtures are test data, not a utility.
import { CONVERSATION_PAGE_SIZE, POSITIVE_RATE_EXCLUSIVE_MIN } from '@/src/constants/analytics/conversations-trace';
import { ConversationFilters, ConversationRow, FeedbackFilter } from '@/src/models/analytics/conversations-trace';

// Flipped by hand, never from the environment: it must not be reachable as a NEXT_PUBLIC_ var.
export const USE_CONVERSATIONS_MOCK: boolean = true;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

interface ConversationFixture extends Omit<
  ConversationRow,
  'last_activity' | 'first_activity' | 'rating_up' | 'rating_down'
> {
  msBeforeRangeEnd: number;
  spanMs: number;
  rates: number[];
}

const CONVERSATION_FIXTURES: ConversationFixture[] = [
  {
    chat_id: '9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204',
    project: 'data-team',
    turns: 3,
    tokens: 10240,
    cost: '0.090342871559',
    msBeforeRangeEnd: 4 * MINUTE_MS,
    rates: [1],
    spanMs: 6 * MINUTE_MS,
    model: 'gpt-4o',
    model_count: 1,
    title: 'Refund policy for annual plans',
    snippet: 'A customer wants a partial refund three months into an annual subscription. What does our policy allow?',
  },
  {
    chat_id: 'c41e8a90-2f76-4bd3-9e05-18c7b6a4f2de',
    project: 'platform-sre',
    turns: 4,
    tokens: 8817,
    cost: '0.079318604227',
    msBeforeRangeEnd: 11 * MINUTE_MS,
    rates: [0],
    spanMs: 4 * MINUTE_MS,
    model: 'claude-3.5-sonnet',
    model_count: 1,
    title: 'Kafka consumer lag spike after deploy',
    snippet: 'Consumer group lag jumped to 40k right after the 14:02 rollout. Can you help me read these metrics?',
  },
  {
    chat_id: '3b7d5f62-8c19-4a04-bf73-2e6019d8ac5b',
    project: 'growth-marketing',
    turns: 2,
    tokens: 3612,
    cost: '0.003612544180',
    msBeforeRangeEnd: 26 * MINUTE_MS,
    rates: [],
    spanMs: 3 * MINUTE_MS,
    model: 'gpt-4o-mini',
    model_count: 1,
    title: null,
    snippet: null,
  },
  {
    chat_id: 'e08a1c34-7b52-4def-89a6-4f1230b7e69c',
    project: 'internal-copilot',
    turns: 12,
    tokens: 48903,
    cost: '0.412884019663',
    msBeforeRangeEnd: 52 * MINUTE_MS,
    rates: [1, 0, 1],
    spanMs: 8 * MINUTE_MS,
    model: 'gpt-4o',
    model_count: 2,
    title: 'Draft Q3 launch announcement',
    snippet: 'Write a short internal announcement for the Q3 launch, aimed at the sales team, under 200 words.',
  },
  {
    chat_id: '7d94f0b8-1e63-45ac-a2f7-90b5c86d3128/branch-2',
    project: 'internal-copilot',
    turns: 1,
    tokens: null,
    cost: null,
    msBeforeRangeEnd: 2 * HOUR_MS + 10 * MINUTE_MS,
    rates: [],
    spanMs: 1 * MINUTE_MS,
    model: 'claude-3.5-sonnet',
    model_count: 1,
    title: 'Untitled conversation',
    snippet: null,
  },
  {
    chat_id: '5a2e7c81-4f90-4b16-8d3e-c7140b962f5e',
    project: '',
    turns: 2,
    tokens: 2148,
    cost: '0.002148733091',
    msBeforeRangeEnd: 4 * HOUR_MS + 40 * MINUTE_MS,
    rates: [1, 1],
    spanMs: 11 * MINUTE_MS,
    model: 'gpt-4o',
    model_count: 1,
    title: 'Explain our data retention defaults',
    snippet: 'How long do we keep request bodies, and where is that configured?',
  },
  {
    chat_id: 'b6f30d24-9a71-4c8e-be05-3f927ac154d8',
    project: 'growth-marketing',
    turns: 156,
    tokens: 1284507,
    cost: '11.560563248017',
    msBeforeRangeEnd: 9 * HOUR_MS + 15 * MINUTE_MS,
    rates: [0, -1],
    spanMs: 47 * MINUTE_MS,
    model: 'gpt-4o-mini',
    model_count: 3,
    title: 'Migrate reporting pipeline to the new schema',
    snippet: 'Walk me through moving the weekly reporting job onto the new event schema without downtime.',
  },
  {
    chat_id: '2c85b1e7-3d40-49fa-97b6-e08d5127c3a9',
    project: 'acme-support-bot',
    turns: 2,
    tokens: 3502,
    cost: '0.003502000000',
    msBeforeRangeEnd: 17 * HOUR_MS + 30 * MINUTE_MS,
    rates: [],
    spanMs: 2 * MINUTE_MS,
    model: 'claude-3.5-sonnet',
    model_count: 1,
    title: 'Password reset loop',
    snippet: 'A user says the reset link always returns to the login page. What should I check first?',
  },
  {
    chat_id: 'f719ad03-5c68-4e21-b4d9-6a0357e8b1fc',
    project: 'internal-copilot',
    turns: 7,
    tokens: 20675,
    cost: '0.186075412908',
    msBeforeRangeEnd: 30 * HOUR_MS,
    rates: [1],
    spanMs: 19 * MINUTE_MS,
    model: 'gpt-4o',
    model_count: 1,
    title: 'Summarise the incident timeline',
    snippet: 'Turn these 40 log lines into a timeline I can paste into the postmortem.',
  },
  {
    chat_id: '4e0b6d95-8f27-41c3-a70e-5921bc4de78a',
    project: 'docs-i18n',
    turns: 2,
    tokens: 8004,
    cost: '0.071236845502',
    msBeforeRangeEnd: 44 * HOUR_MS,
    rates: [-1],
    spanMs: 5 * MINUTE_MS,
    model: 'gpt-4o-mini',
    model_count: 1,
    title: null,
    snippet: 'Translate the onboarding emails into German, keeping the informal tone.',
  },
  {
    chat_id: 'a3d81f5c-6042-4b7e-95af-2c8e70b193d6',
    project: 'data-team',
    turns: 38,
    tokens: 246118,
    cost: '2.214062097734',
    msBeforeRangeEnd: 62 * HOUR_MS,
    rates: [],
    spanMs: 96 * MINUTE_MS,
    model: 'claude-3.5-sonnet',
    model_count: 2,
    title: 'Cost breakdown by deployment',
    snippet: "Which deployments drove most of last month's spend, and how much of it was cached?",
  },
  {
    chat_id: '8c46e2b0-7d91-45f8-83c2-1ea9046f5b73',
    project: 'platform-sre',
    turns: 5,
    tokens: null,
    cost: '0.048915663810',
    msBeforeRangeEnd: 93 * HOUR_MS,
    rates: [1],
    spanMs: 7 * MINUTE_MS,
    model: 'gpt-4o',
    model_count: 1,
    title: 'Node pool sizing for the new model',
    snippet: 'We are adding a 70B model. What GPU node pool should it get?',
  },
  {
    chat_id: '6b90c574-2a83-4de6-b1f0-97c48e2d5a01',
    project: 'acme-support-bot',
    turns: 1,
    tokens: 1067,
    cost: '0.001067000000',
    msBeforeRangeEnd: 128 * HOUR_MS,
    rates: [],
    spanMs: 1 * MINUTE_MS,
    model: 'gpt-4o-mini',
    model_count: 1,
    title: 'Cancel my subscription',
    snippet: 'I want to cancel before the next billing date.',
  },
  {
    chat_id: 'd52741ae-9038-4c1b-86f5-b0e63a97d4c2',
    project: 'docs-i18n',
    turns: 9,
    tokens: 31589,
    cost: '0.284301556429',
    msBeforeRangeEnd: 160 * HOUR_MS,
    rates: [0],
    spanMs: 14 * MINUTE_MS,
    model: 'claude-3.5-sonnet',
    model_count: 1,
    title: 'Review the German localisation strings',
    snippet: 'Check these 20 UI strings for tone and consistency with the rest of the product.',
  },
];

// Fixture activity is anchored to the requested range end so every time preset returns a plausible
// subset instead of the whole set ageing out.
const toRow = (
  { msBeforeRangeEnd, spanMs, rates, ...fixture }: ConversationFixture,
  endMs: number,
): ConversationRow => {
  const up = rates.filter((rate) => rate > POSITIVE_RATE_EXCLUSIVE_MIN).length;

  return {
    ...fixture,
    last_activity: new Date(endMs - msBeforeRangeEnd).toISOString(),
    first_activity: new Date(endMs - msBeforeRangeEnd - spanMs).toISOString(),
    rating_up: up,
    rating_down: rates.length - up,
  };
};

const matchesFeedback = (rates: number[], feedback: FeedbackFilter): boolean => {
  switch (feedback) {
    case FeedbackFilter.Positive:
      return rates.some((rate) => rate > POSITIVE_RATE_EXCLUSIVE_MIN);
    case FeedbackFilter.Negative:
      return rates.some((rate) => rate <= POSITIVE_RATE_EXCLUSIVE_MIN);
    case FeedbackFilter.Rated:
      return rates.length > 0;
    case FeedbackFilter.All:
      return true;
  }
};

export const buildConversationsMock = ({
  search,
  startMs,
  endMs,
  feedback,
}: ConversationFilters): ConversationRow[] => {
  const term = search.trim().toLowerCase();
  const matchesSearch = (row: ConversationRow) =>
    !term || [row.chat_id, row.project, row.title, row.snippet].some((value) => value?.toLowerCase().includes(term));

  return CONVERSATION_FIXTURES.filter((fixture) => matchesFeedback(fixture.rates, feedback))
    .map((fixture) => toRow(fixture, endMs))
    .filter((row) => Date.parse(row.last_activity as string) >= startMs)
    .filter(matchesSearch)
    .slice(0, CONVERSATION_PAGE_SIZE);
};
