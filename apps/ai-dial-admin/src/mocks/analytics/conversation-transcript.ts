import { ConversationMessage, MessageRole } from '@/src/models/analytics/conversations-trace';

interface MockExchange {
  user: string;
  assistant: string;
}

const EXCHANGES: MockExchange[] = [
  {
    user: 'Can you refactor this ETL script to use pandas more efficiently? It loops row by row.',
    assistant:
      'Replace the per-row loop with vectorized operations and a single groupby. That runs roughly 40× faster on your sample.',
  },
  {
    user: 'The groupby drops rows with null keys. Can we keep them?',
    assistant: 'Pass dropna=False to the groupby so null keys form their own group. Updated snippet below.',
  },
  {
    user: 'Give me US GDP for the last five years, using datasets only.',
    assistant:
      'Pulled the series from the national accounts dataset. Values are annual, chained to constant prices, with the source table cited per year.',
  },
  {
    user: 'Check every dataset — I want to be sure nothing is missing.',
    assistant:
      'Swept all available datasets for matching GDP series. Two carry the same measure at different vintages; I kept the more recent and noted the discrepancy.',
  },
  {
    user: 'Summarise the deployment failures from last night.',
    assistant:
      'Three failures, all the same root cause: the image pull timed out against the registry mirror. Two retried successfully; the third needs a manual redeploy.',
  },
  {
    user: 'Why did the cost jump between the two runs?',
    assistant:
      'The second run retried the embedding step twice after a timeout, and each retry re-embedded the whole batch. Prompt tokens tripled while completion tokens stayed flat, which is what pushed the cost up.',
  },
  {
    user: 'Can you write that as a query I can save?',
    assistant:
      "Grouped by deployment and day, summing prompt and completion tokens separately so the retry pattern stays visible:\n\nSELECT deployment, date_trunc('day', request_time) AS day,\n       sum(prompt_tokens) AS tokens_in, sum(completion_tokens) AS tokens_out\nFROM dial_usage_log GROUP BY deployment, day ORDER BY day DESC",
  },
  {
    user: 'What should I watch to catch this earlier?',
    assistant:
      'Alert on prompt tokens per turn rather than on cost. Cost moves for pricing reasons too, whereas a jump in prompt tokens for the same conversation almost always means work was repeated.',
  },
  {
    user: 'Thanks, that helps.',
    assistant: 'Happy to help. Let me know if you want the query saved or exported.',
  },
];

const seedOf = (chatId: string): number => [...chatId].reduce((total, char) => total + char.charCodeAt(0), 0);

export const mockConversationTranscript = (chatId: string, turnCount: number): ConversationMessage[] => {
  if (turnCount <= 0) {
    return [];
  }

  const seed = seedOf(chatId);

  return Array.from({ length: turnCount }, (_unused, turn) => EXCHANGES[(seed + turn) % EXCHANGES.length]).flatMap(
    ({ user, assistant }) => [
      { role: MessageRole.User, content: user },
      { role: MessageRole.Assistant, content: assistant },
    ],
  );
};
