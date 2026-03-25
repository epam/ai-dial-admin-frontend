'use client';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';

/**
 * Header checkbox for a boolean column (e.g. test case `enabled`).
 * Reflects all rows: checked when all true, indeterminate when mixed.
 * Click sets all rows to enabled if any row is off, otherwise all off.
 */
const BooleanColumnHeader = (props: IHeaderParams) => {
  const { api, column } = props;
  const colId = column.getColId();
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  const syncFromGrid = useCallback(() => {
    let total = 0;
    let enabledCount = 0;
    api.forEachNode((node) => {
      if (!node.data) return;
      total += 1;
      if (node.data[colId]) enabledCount += 1;
    });
    if (total === 0) {
      setChecked(false);
      setIndeterminate(false);
      return;
    }
    const allOn = enabledCount === total;
    const allOff = enabledCount === 0;
    setChecked(allOn);
    setIndeterminate(!allOn && !allOff);
  }, [api, colId]);

  useEffect(() => {
    syncFromGrid();
    const listener = () => syncFromGrid();
    api.addEventListener('cellValueChanged', listener);
    api.addEventListener('modelUpdated', listener);
    api.addEventListener('rowDataUpdated', listener);
    return () => {
      api.removeEventListener('cellValueChanged', listener);
      api.removeEventListener('modelUpdated', listener);
      api.removeEventListener('rowDataUpdated', listener);
    };
  }, [api, syncFromGrid]);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const newValue = !checked || indeterminate;
      api.forEachNode((node) => {
        if (!node.data) return;
        node.setDataValue(colId, newValue);
      });
    },
    [api, colId, checked, indeterminate],
  );

  return (
    <div className="flex items-center justify-center size-full">
      <div
        className={classNames('ag-checkbox-input-wrapper', {
          'ag-checked': checked && !indeterminate,
          'ag-indeterminate': indeterminate,
        })}
      >
        <input
          type="checkbox"
          className="ag-input-field-input ag-checkbox-input"
          checked={checked}
          onChange={onChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default BooleanColumnHeader;
