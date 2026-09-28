import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SpanKindBadge from '@/src/components/Analytics/SessionsTrace/Detail/SpanKindBadge';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { SpanKind } from '@/src/models/analytics/sessions-trace';

describe('SpanKindBadge', () => {
  test.each([
    [SpanKind.Llm, SessionsTraceI18nKey.SpanLlm],
    [SpanKind.Mcp, SessionsTraceI18nKey.SpanMcp],
    [SpanKind.Embeddings, SessionsTraceI18nKey.SpanEmbeddings],
    [SpanKind.Route, SessionsTraceI18nKey.SpanRoute],
    [SpanKind.Other, SessionsTraceI18nKey.SpanOther],
  ])('names %s by what the hop log calls it', (kind, key) => {
    render(<SpanKindBadge kind={kind} hasFailed={false} />);

    expect(screen.getByText(key)).toBeInTheDocument();
  });

  // Kind and outcome are two axes: a failed tool call and a failed model call are different problems, and a
  // single badge reading "error" said neither.
  test('states the failure beside the kind rather than instead of it', () => {
    render(<SpanKindBadge kind={SpanKind.Mcp} hasFailed />);

    expect(screen.getByText(SessionsTraceI18nKey.SpanMcp)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.SpanFailedMarker)).toBeInTheDocument();
  });

  test('marks nothing for a hop that succeeded', () => {
    render(<SpanKindBadge kind={SpanKind.Llm} hasFailed={false} />);

    expect(screen.queryByText(SessionsTraceI18nKey.SpanFailedMarker)).toBeNull();
  });
});
