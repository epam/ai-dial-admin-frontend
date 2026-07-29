import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationField } from '@/src/models/analytics/conversations-trace';

const t = (key: string) => key;

const columns = (): ColDef[] => CONVERSATIONS_TRACE_COLUMNS(t);

const column = (fieldName: string): ColDef => columns().find((col) => col.field === fieldName) as ColDef;

const format = (fieldName: string, value: unknown): string =>
  column(fieldName).valueFormatter?.({ value } as ValueFormatterParams) as string;

describe('conversations columns :: composition', () => {
  test('no column offers a filter, so the header shows no filter control', () => {
    columns().forEach((col) => {
      expect(col.filter).toBe(false);
      expect(col.floatingFilter).toBe(false);
    });
  });

  test('exposes exactly the seven displayed columns, in order', () => {
    expect(columns().map((col) => col.field)).toEqual([
      ConversationField.ChatId,
      ConversationField.Project,
      ConversationField.Turns,
      ConversationField.LastActivity,
      ConversationField.Tokens,
      ConversationField.Cost,
      ConversationField.Rating,
    ]);
  });

  test('headers come from i18n keys, not hardcoded strings', () => {
    expect(columns().map((col) => col.headerName)).toEqual([
      ConversationsTraceI18nKey.Conversation,
      ConversationsTraceI18nKey.ProjectModel,
      ConversationsTraceI18nKey.Turns,
      ConversationsTraceI18nKey.Activity,
      ConversationsTraceI18nKey.Tokens,
      ConversationsTraceI18nKey.Cost,
      ConversationsTraceI18nKey.Rating,
    ]);
  });

  test('the conversation column renders through a cell renderer', () => {
    expect(column(ConversationField.ChatId).cellRenderer).toBeTypeOf('function');
  });
});

describe('conversations columns :: read-only contract', () => {
  test('no column is sortable', () => {
    columns().forEach((col) => expect(col.sortable).toBe(false));
  });

  test('no column shows a floating filter', () => {
    columns().forEach((col) => expect(col.floatingFilter).toBe(false));
  });

  test('no column is editable', () => {
    columns().forEach((col) => expect(col.editable).toBeFalsy());
  });
});

describe('conversations columns :: proportions', () => {
  test('the conversation column is the widest', () => {
    const flexes = columns().map((col) => col.flex ?? 0);

    expect(column(ConversationField.ChatId).flex).toBe(Math.max(...flexes));
  });

  test('the conversation column reserves room for a production-length id', () => {
    expect(column(ConversationField.ChatId).minWidth).toBeGreaterThanOrEqual(280);
  });

  test('numeric columns are narrower than the conversation column', () => {
    [ConversationField.Turns, ConversationField.Tokens, ConversationField.Cost].forEach((fieldName) => {
      expect(column(fieldName).flex).toBeLessThan(column(ConversationField.ChatId).flex as number);
    });
  });
});

describe('conversations columns :: value formatting', () => {
  test('token counts are compacted rather than delimited', () => {
    expect(format(ConversationField.Tokens, 1284507)).toBe('1.3 M');
    expect(format(ConversationField.Tokens, 7200)).toBe('7.2 K');
  });

  test('cost renders as currency', () => {
    expect(format(ConversationField.Cost, '0.09')).toBe('$0.09');
  });

  // The shared currency formatter renders every digit of a Decimal(38,12) sum; this column rounds instead, so a
  // real sum stays readable. The rounding is local to this page and leaves other price columns unchanged.
  test('a full-scale decimal cost is rounded to significant digits', () => {
    expect(format(ConversationField.Cost, '0.090000000001')).toBe('$0.09');
    expect(format(ConversationField.Cost, '0.003612544180')).toBe('$0.0036');
  });

  test.each([[ConversationField.Tokens], [ConversationField.Cost], [ConversationField.Turns]])(
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
    expect(column(ConversationField.LastActivity).valueFormatter).toBeUndefined();
    expect(typeof column(ConversationField.LastActivity).cellRenderer).toBe('function');
  });

  test('project renders through a cell renderer so it can carry the model chip', () => {
    expect(typeof column(ConversationField.Project).cellRenderer).toBe('function');
  });
});
