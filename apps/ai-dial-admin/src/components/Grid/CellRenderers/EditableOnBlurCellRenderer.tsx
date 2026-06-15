import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

interface EditableOnBlurCellRendererParams extends ICellRendererParams {
  onBlur?: (value: string, data: unknown, column: string, index?: number) => void;
  validate?: (newValue: string, currentValue: string) => string | null;
  isReadonly?: boolean;
}

const EditableOnBlurCellRenderer = ({
  value,
  onBlur,
  validate,
  isReadonly,
  data,
  colDef,
  node,
}: EditableOnBlurCellRendererParams) => {
  const [draftValue, setDraftValue] = useState<string>(value ?? '');
  const [error, setError] = useState<string | null>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setDraftValue(value ?? '');
      setError(null);
    }
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newDraft = event.target.value;
    setDraftValue(newDraft);
    if (validate) {
      setError(validate(newDraft, value ?? ''));
    }
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (validate) {
      const validationError = validate(draftValue, value ?? '');
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    onBlur?.(draftValue, data, colDef?.field as string, node?.rowIndex as number);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      if ((e.key === 'a' || e.key === 'A') && e.currentTarget.value.length > 0) {
        e.currentTarget.select();
      }
    }
  };

  if (isReadonly) {
    return <div>{draftValue}</div>;
  }

  return (
    <input
      type="text"
      value={draftValue}
      title={error ?? undefined}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={classNames('leading-[18px] h-[32px] dial-input px-2 py-1', error && 'dial-input-error')}
    />
  );
};

export default EditableOnBlurCellRenderer;
