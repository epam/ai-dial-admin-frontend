import { describe, expect, test } from 'vitest';

import { UNTAGGED_SPAN_FIELD_TAG } from '@/src/constants/analytics/conversations-trace';
import { SpanFieldGroup, SpanFieldRow, SpanFieldTag } from '@/src/models/analytics/conversations-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  isSpanFieldEmpty,
  spanFieldText,
  spanGroupSummary,
  spanObjectEntries,
  statedSpanFields,
} from '@/src/utils/analytics/conversation-span-fields';

const row = (overrides: Record<string, unknown> = {}): SpanFieldRow =>
  ({
    core_span_id: 's1',
    core_parent_span_id: null,
    ...overrides,
  }) as SpanFieldRow;

const group = (fields: Array<{ name: string; tag?: string; type?: AnalyticsFieldType }>): SpanFieldGroup => ({
  tag: fields[0]?.tag ?? SpanFieldTag.Identifier,
  fields: fields.map(({ name, tag, type }) => ({
    name,
    label: name,
    type: type ?? AnalyticsFieldType.String,
    tag: tag ?? SpanFieldTag.Identifier,
  })),
});

describe('isSpanFieldEmpty', () => {
  test('treats an absent, blank or empty value as empty', () => {
    expect(isSpanFieldEmpty(null, SpanFieldTag.Identifier)).toBe(true);
    expect(isSpanFieldEmpty(undefined, SpanFieldTag.Identifier)).toBe(true);
    expect(isSpanFieldEmpty('', SpanFieldTag.Identifier)).toBe(true);
    expect(isSpanFieldEmpty([], SpanFieldTag.Deployment)).toBe(true);
  });

  test('treats a recorded value as a value', () => {
    expect(isSpanFieldEmpty('s1', SpanFieldTag.Identifier)).toBe(false);
    expect(isSpanFieldEmpty(['a'], SpanFieldTag.Deployment)).toBe(false);
    expect(isSpanFieldEmpty(false, SpanFieldTag.Response)).toBe(false);
  });

  // `request_tags` and `jwt_claims` arrive as objects, and one recorded with nothing in it has no pair to
  // state — while one with a single pair does.
  test('treats an object with no renderable pair as empty', () => {
    expect(isSpanFieldEmpty({}, SpanFieldTag.Request)).toBe(true);
    expect(isSpanFieldEmpty({ absent: null }, SpanFieldTag.Request)).toBe(true);
    expect(isSpanFieldEmpty({ 'x-app': 'cli' }, SpanFieldTag.Request)).toBe(false);
  });

  test('treats a zero as empty for a metered tag and as a value elsewhere', () => {
    expect(isSpanFieldEmpty(0, SpanFieldTag.TokenUsage)).toBe(true);
    expect(isSpanFieldEmpty(0, SpanFieldTag.Cost)).toBe(true);
    expect(isSpanFieldEmpty(0, SpanFieldTag.Performance)).toBe(true);
    expect(isSpanFieldEmpty(0, SpanFieldTag.Request)).toBe(false);
    expect(isSpanFieldEmpty(0, SpanFieldTag.Identifier)).toBe(false);
  });
});

describe('spanFieldText', () => {
  test('renders nothing for a value the span does not carry', () => {
    expect(spanFieldText(null, AnalyticsFieldType.String)).toBe('');
    expect(spanFieldText(undefined, AnalyticsFieldType.String)).toBe('');
    expect(spanFieldText('', AnalyticsFieldType.String)).toBe('');
  });

  test('renders an array as the list the log recorded', () => {
    expect(spanFieldText(['an-app', 'a-model'], AnalyticsFieldType.Array)).toBe('an-app, a-model');
  });

  test('renders a timestamp to the millisecond, with the fraction after the seconds', () => {
    const recorded = '2026-08-13T10:59:07.100Z';
    const text = spanFieldText(recorded, AnalyticsFieldType.Timestamp);

    expect(text).toContain(':07.100');
    expect(text).not.toMatch(/\.100$/);
  });

  test('renders a closed value set as words', () => {
    expect(spanFieldText('llm_call', AnalyticsFieldType.Enum)).toBe('Llm call');
  });

  // Exact rather than compact: a figure states its value beside the breakdown it belongs to, and `7.5 K`
  // cannot be checked against its own parts.
  test('renders a figure exactly, not compacted', () => {
    expect(spanFieldText(7511, AnalyticsFieldType.Long)).toBe((7511).toLocaleString());
  });

  // An object normally reaches the register that renders its pairs; this is the fallback for one that
  // arrives under a type that says it is something else.
  test('renders an object as the JSON it was recorded as', () => {
    expect(spanFieldText({ a: 1 }, AnalyticsFieldType.String)).toBe('{"a":1}');
  });

  test('renders anything else as recorded', () => {
    expect(spanFieldText('POST', AnalyticsFieldType.String)).toBe('POST');
    expect(spanFieldText(true, AnalyticsFieldType.Boolean)).toBe('true');
  });
});

describe('statedSpanFields', () => {
  test('keeps the fields this span has a value for, in the schema’s order', () => {
    const stated = statedSpanFields(
      row({ b: 'two', c: 'three' }),
      group([{ name: 'a' }, { name: 'b' }, { name: 'c' }]),
    );

    expect(stated.map(({ name }) => name)).toEqual(['b', 'c']);
  });
});

describe('spanGroupSummary — a figure group', () => {
  const tokens: SpanFieldGroup = {
    tag: SpanFieldTag.TokenUsage,
    fields: [
      {
        name: 'cached_prompt_tokens',
        label: 'Cached prompt tokens',
        type: AnalyticsFieldType.Long,
        tag: SpanFieldTag.TokenUsage,
      },
      { name: 'prompt_tokens', label: 'Prompt tokens', type: AnalyticsFieldType.Long, tag: SpanFieldTag.TokenUsage },
    ],
  };

  // Its own first field is a cache count — a part of another figure, and not what the group is read for.
  test('previews the hop total named for the tag rather than the group’s first field', () => {
    const summary = spanGroupSummary(
      row({ cached_prompt_tokens: 3720, prompt_tokens: 5067, total_tokens: 6106 }),
      tokens,
    );

    expect(summary).toBe((6106).toLocaleString());
  });

  // A hop that metered nothing records a zero the column cannot tell from "not reported", so the preview
  // falls back rather than stating it.
  test('falls back to the group’s own first value where the named column reported nothing', () => {
    expect(spanGroupSummary(row({ cached_prompt_tokens: 3720, total_tokens: 0 }), tokens)).toBe(
      (3720).toLocaleString(),
    );
  });
});

describe('spanGroupSummary — the untagged group', () => {
  const untagged: SpanFieldGroup = {
    tag: UNTAGGED_SPAN_FIELD_TAG,
    fields: [
      { name: 'a', label: 'A', type: AnalyticsFieldType.String, tag: UNTAGGED_SPAN_FIELD_TAG },
      { name: 'b', label: 'B', type: AnalyticsFieldType.String, tag: UNTAGGED_SPAN_FIELD_TAG },
    ],
  };

  // Whatever the catalog did not group: its first value stands for nothing.
  test('previews nothing, neither a value nor a count', () => {
    expect(spanGroupSummary(row({ a: 'f0e1d2c3', b: 'x' }), untagged)).toBe('');
  });

  test('previews nothing when it holds no recorded field', () => {
    expect(spanGroupSummary(row(), untagged)).toBe('');
  });
});

describe('spanGroupSummary — the call groups', () => {
  const requestGroup: SpanFieldGroup = {
    tag: SpanFieldTag.Request,
    fields: [
      { name: 'mcp_method', label: 'MCP method', type: AnalyticsFieldType.String, tag: SpanFieldTag.Request },
      { name: 'request_method', label: 'Request method', type: AnalyticsFieldType.String, tag: SpanFieldTag.Request },
    ],
  };

  const responseGroup: SpanFieldGroup = {
    tag: SpanFieldTag.Response,
    fields: [
      {
        name: 'response_status',
        label: 'Response status',
        type: AnalyticsFieldType.Integer,
        tag: SpanFieldTag.Response,
      },
      { name: 'success', label: 'Success', type: AnalyticsFieldType.Boolean, tag: SpanFieldTag.Response },
    ],
  };

  test('previews the request by its verb', () => {
    expect(spanGroupSummary(row({ mcp_method: 'tools/call', request_method: 'POST' }), requestGroup)).toBe('POST');
  });

  test('previews the response by its status', () => {
    expect(spanGroupSummary(row({ response_status: 200, success: true }), responseGroup)).toBe('200');
  });

  test('falls back to the group’s first value where the named column reported nothing', () => {
    expect(spanGroupSummary(row({ mcp_method: 'tools/call' }), requestGroup)).toBe('tools/call');
  });
});

describe('spanFieldText — a cost column', () => {
  // Cost columns are `decimal` and run below the cent: `toLocaleString` keeps three decimals, so a hop that
  // spent $0.0000075 would state 0.
  test('renders a sub-cent figure through the cost formatter', () => {
    expect(spanFieldText(0.0000075, AnalyticsFieldType.Decimal, SpanFieldTag.Cost)).toBe('$0.0000075');
  });

  // A service that serialises the decimal as a string used to fall through to the raw twelve places.
  test('renders a decimal served as a string as money', () => {
    expect(spanFieldText('0.0112755', AnalyticsFieldType.Decimal, SpanFieldTag.Cost)).toBe('$0.011');
  });

  test('leaves a figure outside a cost group as a plain number', () => {
    expect(spanFieldText(7511, AnalyticsFieldType.Long, SpanFieldTag.TokenUsage)).toBe((7511).toLocaleString());
  });
});
