import { render } from '@testing-library/react';
import { ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsList from '@/src/components/Analytics/ConversationsTrace/List/ConversationsList';
import {
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
  CONVERSATIONS_ROW_HEIGHT,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ColumnProvenance, ConversationField, ConversationRow } from '@/src/models/analytics/conversations-trace';

interface CapturedProps {
  rowData?: ConversationRow[] | null;
  columnDefs?: ColGroupDef[];
  additionalGridOptions?: GridOptions;
  emptyDataProps?: { title?: string };
  storageKey?: string;
  getRowId?: (params: { data: ConversationRow }) => string;
}

const leafColumns = (): ColDef[] => (captured.columnDefs ?? []).flatMap((group) => group.children as ColDef[]);

let captured: CapturedProps = {};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: CapturedProps) => {
    captured = props;
    return <section aria-label="grid" />;
  },
}));

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: '9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204',
  project: 'data-team',
  turns: 3,
  tokens: 10240,
  cost: '0.090342871559',
  last_activity: '2026-07-28T09:41:12.318Z',
  first_activity: '2026-07-28T09:35:12.318Z',
  model: 'gpt-4o',
  model_count: 1,
  title: null,
  snippet: null,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const ROWS: ConversationRow[] = [
  row(),
  row({
    chat_id: 'c41e8a90-2f76-4bd3-9e05-18c7b6a4f2de',
    project: 'platform-sre',
    turns: 4,
    tokens: 8817,
    cost: '0.079318604227',
    last_activity: '2026-07-28T07:16:55.902Z',
  }),
];

describe('ConversationsList', () => {
  beforeEach(() => {
    captured = {};
  });

  test('passes the supplied conversations through as row data, order preserved', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(captured.rowData).toEqual(ROWS);
  });

  test('passes an empty list through rather than null', () => {
    render(<ConversationsList conversations={[]} />);

    expect(captured.rowData).toEqual([]);
  });

  test('supplies the seven read-only columns, in order, across the provenance groups', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(leafColumns().map((col) => col.field)).toEqual([
      ConversationField.ChatId,
      ConversationField.Project,
      ConversationField.Turns,
      ConversationField.LastActivity,
      ConversationField.Tokens,
      ConversationField.Cost,
      ConversationField.Rating,
    ]);
  });

  test('every supplied column is unsortable and unfiltered', () => {
    render(<ConversationsList conversations={ROWS} />);

    leafColumns().forEach((col) => {
      expect(col.sortable).toBe(false);
      expect(col.floatingFilter).toBe(false);
    });
  });

  test('disables the filter itself, not just the floating filter row', () => {
    render(<ConversationsList conversations={ROWS} />);

    leafColumns().forEach((col) => {
      expect(col.filter).toBe(false);
    });
  });

  test('supplies the empty-state title for the no-data case', () => {
    render(<ConversationsList conversations={[]} />);

    expect(captured.emptyDataProps?.title).toBe(ConversationsTraceI18nKey.NoConversations);
  });

  test('says the load failed rather than "no conversations" when the request never returned rows', () => {
    render(<ConversationsList conversations={[]} hasLoadError />);

    expect(captured.emptyDataProps?.title).toBe(ConversationsTraceI18nKey.ConversationsLoadFailed);
  });

  test('owns its row height rather than inheriting the shared default', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(captured.additionalGridOptions?.rowHeight).toBe(CONVERSATIONS_ROW_HEIGHT);
  });

  test('never passes defaultColDef through additionalGridOptions', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(captured.additionalGridOptions).not.toHaveProperty('defaultColDef');
  });

  test('sets no storage key, so column auto-sizing stays enabled', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(captured.storageKey).toBeUndefined();
  });

  test('identifies rows by conversation id', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(captured.getRowId?.({ data: ROWS[0] })).toBe(ROWS[0].chat_id);
  });

  test('gives the provenance band and the header row their own heights', () => {
    render(<ConversationsList conversations={ROWS} />);

    expect(captured.additionalGridOptions?.groupHeaderHeight).toBe(CONVERSATIONS_GROUP_HEADER_HEIGHT);
    expect(captured.additionalGridOptions?.headerHeight).toBe(CONVERSATIONS_HEADER_HEIGHT);
  });
});

describe('ConversationsList :: provenance band', () => {
  beforeEach(() => {
    captured = {};
    render(<ConversationsList conversations={ROWS} />);
  });

  test('groups the columns by where their data comes from', () => {
    expect(captured.columnDefs?.map((group) => group.groupId)).toEqual([
      ColumnProvenance.Enrichment,
      ColumnProvenance.UsageLog,
      ColumnProvenance.Feedback,
    ]);
  });

  test('labels each group and explains it in a tooltip', () => {
    expect(captured.columnDefs?.map((group) => group.headerName)).toEqual([
      ConversationsTraceI18nKey.ProvenanceConversation,
      ConversationsTraceI18nKey.ProvenanceUsageLog,
      ConversationsTraceI18nKey.ProvenanceFeedback,
    ]);
    expect(captured.columnDefs?.map((group) => group.headerTooltip)).toEqual([
      ConversationsTraceI18nKey.ProvenanceConversationHint,
      ConversationsTraceI18nKey.ProvenanceUsageLogHint,
      ConversationsTraceI18nKey.ProvenanceFeedbackHint,
    ]);
  });

  test('marks only the enrichment-backed group as derived', () => {
    const derived = captured.columnDefs?.map((group) => group.headerGroupComponentParams?.isDerived);

    expect(derived).toEqual([true, undefined, undefined]);
  });

  test('every group carries the provenance header component', () => {
    captured.columnDefs?.forEach((group) => {
      expect(typeof group.headerGroupComponent).toBe('function');
      expect(group.headerGroupComponentParams?.provenance).toBe(group.groupId);
    });
  });

  test('puts the conversation column alone under the enrichment group', () => {
    expect((captured.columnDefs?.[0].children as ColDef[]).map((col) => col.field)).toEqual([ConversationField.ChatId]);
  });

  test('assigns the aggregate columns to the usage-log group', () => {
    expect((captured.columnDefs?.[1].children as ColDef[]).map((col) => col.field)).toEqual([
      ConversationField.Project,
      ConversationField.Turns,
      ConversationField.LastActivity,
      ConversationField.Tokens,
      ConversationField.Cost,
    ]);
  });

  test('attributes the rating column to rate_analytics, not to the usage log', () => {
    expect((captured.columnDefs?.[2].children as ColDef[]).map((col) => col.field)).toEqual([ConversationField.Rating]);
  });

  test('leaves no column unattributed', () => {
    const grouped = (captured.columnDefs ?? []).flatMap((group) => group.children as ColDef[]);

    expect(grouped).toHaveLength(7);
  });

  test('keeps groups intact when columns move', () => {
    captured.columnDefs?.forEach((group) => {
      expect(group.marryChildren).toBe(true);
    });
  });
});
