import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { baseNumberFilter, baseStringFilter } from '@/src/constants/grid-columns/filters';
import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationColumn, ConversationsField } from '@/src/models/analytics/conversations-trace';

const t = (key: string) => key;

const columns = (): ColDef[] => CONVERSATIONS_TRACE_COLUMNS(t);

const column = (fieldName: string): ColDef => columns().find((col) => col.field === fieldName) as ColDef;

const format = (fieldName: string, value: unknown): string =>
  column(fieldName).valueFormatter?.({ value } as ValueFormatterParams) as string;

describe('conversations columns :: composition', () => {
  test('exposes exactly the ten displayed columns, in order', () => {
    expect(columns().map((col) => col.field)).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationsField.DurationMs,
      ConversationsField.Deployments,
      ConversationColumn.Rating,
    ]);
  });

  test('headers come from i18n keys, not hardcoded strings', () => {
    expect(columns().map((col) => col.headerName)).toEqual([
      ConversationsTraceI18nKey.Conversation,
      ConversationsTraceI18nKey.Project,
      ConversationsTraceI18nKey.DetailUser,
      ConversationsTraceI18nKey.Turns,
      ConversationsTraceI18nKey.Activity,
      ConversationsTraceI18nKey.Tokens,
      ConversationsTraceI18nKey.Cost,
      ConversationsTraceI18nKey.Duration,
      ConversationsTraceI18nKey.Models,
      ConversationsTraceI18nKey.Rating,
    ]);
  });

  test('the user column reuses the label the detail page uses for the same field', () => {
    expect(column(ConversationsField.UserHash).headerName).toBe(ConversationsTraceI18nKey.DetailUser);
  });

  test('the conversation column renders through a cell renderer', () => {
    expect(column(ConversationsField.ChatId).cellRenderer).toBeTypeOf('function');
  });
});

describe('conversations columns :: sort and filter contract', () => {
  const FIELD_BACKED = [
    ConversationsField.ChatId,
    ConversationsField.ProjectId,
    ConversationsField.UserHash,
    ConversationsField.TurnCount,
    ConversationsField.LastRequestTime,
    ConversationsField.TotalTokens,
    ConversationsField.TotalPrice,
    ConversationsField.DurationMs,
  ];

  test.each(FIELD_BACKED)('%s is sortable, because the query can order the whole result by it', (fieldName) => {
    expect(column(fieldName).sortable).not.toBe(false);
  });

  test('rating is not sortable and offers no filter', () => {
    expect(column(ConversationColumn.Rating).sortable).toBe(false);
    expect(column(ConversationColumn.Rating).filter).toBe(false);
  });

  // The query language expresses no ordering or predicate over an array, and the grid pages server-side, so a
  // client-side comparator would order the loaded page and misstate what it did.
  test('models offers neither a sort nor a filter affordance', () => {
    expect(column(ConversationsField.Deployments).sortable).toBe(false);
    expect(column(ConversationsField.Deployments).filter).toBe(false);
  });

  test.each([[ConversationsField.ChatId], [ConversationsField.ProjectId], [ConversationsField.UserHash]])(
    '%s offers a text filter',
    (fieldName) => {
      expect(column(fieldName).filter).not.toBe(false);
      expect(column(fieldName).filterParams?.filterOptions).toEqual(baseStringFilter.filterParams?.filterOptions);
    },
  );

  test.each([
    [ConversationsField.TurnCount],
    [ConversationsField.TotalTokens],
    [ConversationsField.TotalPrice],
    [ConversationsField.DurationMs],
  ])('%s offers a number filter', (fieldName) => {
    expect(column(fieldName).filter).toBe(baseNumberFilter.filter);
    expect(column(fieldName).filterParams?.filterOptions).toEqual(baseNumberFilter.filterParams?.filterOptions);
  });

  test('activity sorts but offers no filter', () => {
    expect(column(ConversationsField.LastRequestTime).sortable).not.toBe(false);
    expect(column(ConversationsField.LastRequestTime).filter).toBe(false);
  });

  test('text filters offer no prefix or suffix matching', () => {
    const options = column(ConversationsField.ChatId).filterParams?.filterOptions as string[];

    expect(options).not.toContain('startsWith');
    expect(options).not.toContain('endsWith');
  });

  test('the default ordering is stated as a sort model on activity', () => {
    expect(column(ConversationsField.LastRequestTime).sort).toBe('desc');
    expect(columns().filter((col) => col.sort).length).toBe(1);
  });

  test('no column is editable', () => {
    columns().forEach((col) => expect(col.editable).toBeFalsy());
  });
});

describe('conversations columns :: proportions', () => {
  test('the conversation column is the widest', () => {
    const flexes = columns().map((col) => col.flex ?? 0);

    expect(column(ConversationsField.ChatId).flex).toBe(Math.max(...flexes));
  });

  test('the conversation column reserves room for a production-length id', () => {
    expect(column(ConversationsField.ChatId).minWidth).toBeGreaterThanOrEqual(280);
  });

  test('the user column is sized for a hash rather than a display name', () => {
    expect(column(ConversationsField.UserHash).minWidth).toBeGreaterThanOrEqual(140);
    expect(column(ConversationsField.UserHash).flex).toBeLessThan(column(ConversationsField.ProjectId).flex as number);
  });

  test('numeric columns are narrower than the conversation column', () => {
    [ConversationsField.TurnCount, ConversationsField.TotalTokens, ConversationsField.TotalPrice].forEach(
      (fieldName) => {
        expect(column(fieldName).flex).toBeLessThan(column(ConversationsField.ChatId).flex as number);
      },
    );
  });
});

describe('conversations columns :: value formatting', () => {
  test('token counts are compacted rather than delimited', () => {
    expect(format(ConversationsField.TotalTokens, 1284507)).toBe('1.3 M');
    expect(format(ConversationsField.TotalTokens, 7200)).toBe('7.2 K');
  });

  test('cost renders as currency', () => {
    expect(format(ConversationsField.TotalPrice, '0.09')).toBe('$0.09');
  });

  // The shared currency formatter renders every digit of a Decimal(38,12) sum; this column rounds instead, so a
  // real sum stays readable. The rounding is local to this page and leaves other price columns unchanged.
  test('a full-scale decimal cost is rounded to significant digits', () => {
    expect(format(ConversationsField.TotalPrice, '0.090000000001')).toBe('$0.09');
    expect(format(ConversationsField.TotalPrice, '0.003612544180')).toBe('$0.0036');
  });

  test.each([[ConversationsField.TotalTokens], [ConversationsField.TotalPrice], [ConversationsField.TurnCount]])(
    '%s renders empty for a null aggregate rather than 0 or NaN',
    (fieldName) => {
      const formatted = format(fieldName, null);

      expect(formatted).toBe('');
      expect(formatted).not.toContain('NaN');
    },
  );

  // Activity moved to a cell renderer so it can stack the relative time over the span; both wire shapes and the
  // null case are covered by ActivityCellRenderer's own tests.
  test('activity renders through a cell renderer rather than a value formatter', () => {
    expect(column(ConversationsField.LastRequestTime).valueFormatter).toBeUndefined();
    expect(typeof column(ConversationsField.LastRequestTime).cellRenderer).toBe('function');
  });

  test('project renders through a cell renderer so an unattributed project is marked', () => {
    expect(typeof column(ConversationsField.ProjectId).cellRenderer).toBe('function');
  });

  test('user renders through a cell renderer so a missing hash is marked', () => {
    expect(typeof column(ConversationsField.UserHash).cellRenderer).toBe('function');
    expect(column(ConversationsField.UserHash).valueFormatter).toBeUndefined();
  });

  test.each([
    ['a sub-minute duration', 6709, '6.7s'],
    ['a multi-minute duration', 275234, '4m 35s'],
  ])('duration renders %s as %s', (_label, value, expected) => {
    expect(format(ConversationsField.DurationMs, value)).toBe(expected);
  });

  // A conversation that ran took time, so a 0 records that the backend never measured it.
  test('duration renders an unmeasured zero as the unavailable marker rather than 0s', () => {
    expect(format(ConversationsField.DurationMs, 0)).toBe(UNAVAILABLE_VALUE);
  });

  test('models renders through a cell renderer over the narrowed list', () => {
    const models = column(ConversationsField.Deployments);
    const params = models.cellRendererParams as (params: unknown) => { items: string[]; allItems: string[] };
    const deployments = ['dial-chathub-v2-gemini-3.1-pro-preview', 'gemini-3.1-pro-preview'];

    expect(typeof models.cellRenderer).toBe('function');
    expect(params({ data: { deployments } })).toMatchObject({
      items: ['gemini-3.1-pro-preview'],
      allItems: deployments,
    });
  });

  // The narrowing drops values from the pills, so the tooltip has to carry the whole record.
  test('the models tooltip states every recorded deployment, including the narrowed-away ones', () => {
    const models = column(ConversationsField.Deployments);
    const deployments = ['applications/public/qa__0.0.1', 'gpt-4.1-2025-04-14'];

    expect(models.tooltipValueGetter?.({ data: { deployments } } as never)).toBe(
      'applications/public/qa__0.0.1, gpt-4.1-2025-04-14',
    );
  });
});
