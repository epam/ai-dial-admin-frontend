'use client';

import { IFloatingFilterParams } from 'ag-grid-community';
import { forwardRef, useImperativeHandle } from 'react';

/**
 * An enum column's floating-filter body: deliberately empty.
 *
 * It exists only to displace something, not to render anything. Two other things would otherwise take this
 * slot and both are wrong here:
 *
 * - The grid's **default** floating filter for this app is a text entry (`AgGridWrapper` registers one for
 *   every column). Typing in it would write a text model over this column's value model.
 * - Opting out of the row entirely (`floatingFilter: false`, which this column did until now) moved the
 *   affordance up into the header row, a level above every neighbouring column's filter, and left it
 *   reachable only by hovering.
 *
 * With the body empty and the grid's own floating-filter button left in place, an enum column gets exactly
 * the button its neighbours have, in the row its neighbours have it in — no second control, and nothing
 * custom to drift from the default styling. The button opens the value popup; the header's filter icon marks
 * the column as narrowed, as it does for every other column.
 *
 * `onParentModelChanged` is required by the floating-filter interface and has nothing to update.
 */
const ConversationValueFloatingFilter = forwardRef<unknown, IFloatingFilterParams>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    onParentModelChanged() {
      // Nothing is rendered from the model; the grid's own button and header icon carry the state.
    },
  }));

  return <div className="h-full w-full" />;
});

ConversationValueFloatingFilter.displayName = 'ConversationValueFloatingFilter';

export default ConversationValueFloatingFilter;
