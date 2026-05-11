import { CellClickedEvent } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ApplicationRoute } from '@/src/types/routes';
import { onCellClicked } from '../on-cell-clicked';

const makeEvent = (
  overrides: Partial<{ field: string; mouseEvent: Partial<MouseEvent>; data: object }> = {},
): CellClickedEvent => {
  const { field = 'name', mouseEvent = {}, data = { name: 'entity-1' } } = overrides;
  return {
    colDef: { field },
    data,
    event: { ctrlKey: false, metaKey: false, button: 0, ...mouseEvent } as MouseEvent,
  } as unknown as CellClickedEvent;
};

describe('onCellClicked', () => {
  const push = vi.fn();
  const route = ApplicationRoute.Adapters;

  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal('open', vi.fn());
  });

  test('calls router.push on plain left-click', () => {
    onCellClicked(makeEvent(), route, push);
    expect(push).toHaveBeenCalledWith('/adapters/entity-1');
    expect(window.open).not.toHaveBeenCalled();
  });

  test('calls window.open and skips router.push when ctrlKey is true', () => {
    onCellClicked(makeEvent({ mouseEvent: { ctrlKey: true } }), route, push);
    expect(window.open).toHaveBeenCalledWith('/adapters/entity-1', '_blank');
    expect(push).not.toHaveBeenCalled();
  });

  test('calls window.open and skips router.push when metaKey is true', () => {
    onCellClicked(makeEvent({ mouseEvent: { metaKey: true } }), route, push);
    expect(window.open).toHaveBeenCalledWith('/adapters/entity-1', '_blank');
    expect(push).not.toHaveBeenCalled();
  });

  test('calls window.open and skips router.push on middle-click (button === 1)', () => {
    onCellClicked(makeEvent({ mouseEvent: { button: 1 } }), route, push);
    expect(window.open).toHaveBeenCalledWith('/adapters/entity-1', '_blank');
    expect(push).not.toHaveBeenCalled();
  });

  test('does nothing when field is ACTIONS_COLUMN_CEL_ID', () => {
    onCellClicked(makeEvent({ field: ACTIONS_COLUMN_CEL_ID }), route, push);
    expect(push).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });
});
