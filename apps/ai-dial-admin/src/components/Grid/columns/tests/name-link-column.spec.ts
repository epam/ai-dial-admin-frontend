import { describe, expect, test } from 'vitest';

import DisplayNameCellRenderer from '@/src/components/Grid/CellRenderers/DisplayNameCellRenderer';
import LinkCellRenderer from '@/src/components/Grid/CellRenderers/LinkCellRenderer';
import TitleSubtitleCellRenderer from '@/src/components/Grid/CellRenderers/TitleSubtitleCellRenderer';
import { moveColumnFirst, withColumnLink, withNameLink } from '@/src/components/Grid/columns/name-link-column';

const getHref = (data: unknown) => `/models/${(data as { name: string }).name}`;

describe('withNameLink', () => {
  test('adds the href getter to the display-name column and keeps its params', () => {
    const [column] = withNameLink(
      [{ field: 'displayName', cellRenderer: DisplayNameCellRenderer, cellRendererParams: { typeIcon: 'icon' } }],
      getHref,
    );

    expect(column.cellRendererParams).toEqual({ typeIcon: 'icon', getHref });
  });

  test('renders the named plain field through the link renderer', () => {
    const [column] = withNameLink([{ field: 'name' }], getHref, 'name');

    expect(column.cellRenderer).toBe(LinkCellRenderer);
    expect(column.cellRendererParams.getHref({ name: 'gpt' })).toBe('/models/gpt');
  });

  test('adds the href getter to a named title-subtitle column and keeps its params', () => {
    const getSubtitle = () => 'subtitle';
    const [status, name] = withNameLink(
      [
        { colId: 'status' },
        { colId: 'testRunName', cellRenderer: TitleSubtitleCellRenderer, cellRendererParams: { getSubtitle } },
      ],
      getHref,
      'testRunName',
    );

    expect(status).toEqual({ colId: 'status' });
    expect(name.cellRendererParams).toEqual({ getSubtitle, getHref });
  });

  test('leaves a named field that already has its own renderer untouched', () => {
    const renderer = () => null;
    const [column] = withNameLink([{ field: 'name', cellRenderer: renderer }], getHref, 'name');

    expect(column.cellRenderer).toBe(renderer);
    expect(column.cellRendererParams).toBeUndefined();
  });

  test('keeps the column order and every other column as is', () => {
    const description = { field: 'description' };
    const columns = withNameLink([description, { field: 'name' }], getHref, 'name');

    expect(columns[0]).toBe(description);
    expect(columns[1].field).toBe('name');
  });

  test('returns the columns unchanged when there is no name column', () => {
    const description = { field: 'description' };

    expect(withNameLink([description], getHref)).toEqual([description]);
  });
});

describe('withColumnLink', () => {
  test('links only the named column, even beside a display-name column', () => {
    const [name, target] = withColumnLink(
      [{ field: 'displayName', cellRenderer: DisplayNameCellRenderer }, { field: 'target' }],
      'target',
      getHref,
      { isNewTab: true },
    );

    expect(name.cellRendererParams).toBeUndefined();
    expect(target.cellRenderer).toBe(LinkCellRenderer);
    expect(target.cellRendererParams).toEqual({ isNewTab: true, getHref });
  });

  test('leaves the columns unchanged when the field is absent', () => {
    const columns = [{ field: 'description' }];

    expect(withColumnLink(columns, 'target', getHref)).toEqual(columns);
  });
});

describe('moveColumnFirst', () => {
  test('moves a column found by colId right after the leading columns', () => {
    const columns = moveColumnFirst([{ colId: 'expander' }, { field: 'type' }, { colId: 'id' }], 'id', ['expander']);

    expect(columns.map((column) => column.colId ?? column.field)).toEqual(['expander', 'id', 'type']);
  });
});
