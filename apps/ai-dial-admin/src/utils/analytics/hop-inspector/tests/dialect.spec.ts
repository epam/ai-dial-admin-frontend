import { describe, expect, test } from 'vitest';

import { HopDialect } from '@/src/models/analytics/conversations-trace';
import { dialectOf } from '@/src/utils/analytics/hop-inspector/dialect';

describe('dialectOf', () => {
  test.each([
    ['/openai/deployments/gpt/chat/completions', HopDialect.ChatCompletions],
    ['/anthropic/v1/messages', HopDialect.Messages],
    ['/claude_code_router/v1/messages', HopDialect.Messages],
    ['/openai/deployments/ali.qwen3.7-plus/v1/responses', HopDialect.Responses],
  ])('resolves %s from the endpoint', (uri, expected) => {
    expect(dialectOf(uri)).toBe(expected);
  });

  // An endpoint no parser claims routes to the raw view rather than through the nearest-looking parser:
  // reading a Responses-API body as a chat-completions body renders a confidently wrong message list.
  // `/v1/completions` recorded zero hops in two weeks and is deliberately left on that fallback.
  test.each(['/v1/completions', '/openai/deployments/x/embeddings', ''])(
    '%s has no parser and is left unknown',
    (uri) => {
      expect(dialectOf(uri)).toBe(HopDialect.Unknown);
    },
  );

  test('a missing endpoint is unknown rather than a throw', () => {
    expect(dialectOf(null)).toBe(HopDialect.Unknown);
  });
});
