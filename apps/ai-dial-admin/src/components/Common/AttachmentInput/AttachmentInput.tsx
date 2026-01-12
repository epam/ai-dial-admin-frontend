'use client';

import { ChangeEventHandler, FC, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

import { DialNeutralButton, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { isEqual } from 'lodash';

import Field from '@/src/components/Common/Field/Field';
import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import Suggestions from './Suggestions';

export interface AttachmentOption {
  label: string;
  value: string;
}

export interface Props {
  availableItems: AttachmentOption[];
  initialValues?: string[];
  placeholder?: string;
  fieldTitle?: string;
  allValueLabel?: string;
  elementId?: string;
  optional?: boolean;
  disable?: boolean;
  onChange?: (values: string[]) => void;
}

const ALL_ATTACHMENTS_VALUE = [{ label: ALL_ATTACHMENTS, value: ALL_ATTACHMENTS }];

const AttachmentInput: FC<Props> = ({
  availableItems,
  initialValues = [],
  fieldTitle,
  placeholder,
  allValueLabel,
  elementId,
  optional,
  disable,
  onChange,
}) => {
  const t = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);

  const initialSelected = initialValues
    .map((val) => availableItems.find((o) => o.value === val) || { label: val, value: val })
    .filter(Boolean) as AttachmentOption[];

  const [selected, setSelected] = useState<AttachmentOption[]>(initialSelected);
  const [inputValue, setInputValue] = useState('');
  const [wraps, setWraps] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const hasWrapped = containerRef.current.scrollHeight > containerRef.current.clientHeight + 10;
        setWraps(hasWrapped);
      }
    });

    if (containerRef.current) {
      observer?.observe?.(containerRef.current);
    }

    return () => observer?.disconnect?.();
  }, []);

  const allSelected = isEqual(selected, ALL_ATTACHMENTS_VALUE);

  const fireChange = useCallback(
    (items: AttachmentOption[]) => {
      onChange?.(items.map((i) => i.value));
    },
    [onChange],
  );

  const filteredSuggestions = availableItems
    .filter(
      (opt) =>
        !selected.some((s) => s.value === opt.value) &&
        (opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())),
    )
    .slice(0, 5);

  const setValues = useCallback(
    (value: AttachmentOption[]) => {
      setSelected(value);
      fireChange(value);
      setInputValue('');
      setShowSuggestions(false);
    },
    [fireChange],
  );

  const addAttachment = useCallback(
    (item?: AttachmentOption | string) => {
      let newItem: AttachmentOption | undefined;

      if (typeof item === 'string') {
        if (!item.trim()) return;
        newItem = { label: item.trim(), value: item.trim() };
      } else {
        newItem = item;
      }

      if (!newItem || selected.some((sel) => sel.value === newItem.value)) return;

      const newSelected = [...selected, newItem];
      setValues(newSelected);
      setHighlight(0);
    },
    [selected, setValues],
  );

  const removeAttachment = useCallback(
    (index: number) => {
      if (allSelected) {
        setValues([]);
        return;
      }

      setValues(selected.filter((_, i) => i !== index));
    },
    [allSelected, selected, setValues],
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      return;
    }

    setValues(ALL_ATTACHMENTS_VALUE);
  }, [allSelected, setValues]);

  const handleSelectNone = useCallback(() => {
    setValues([]);
  }, [setValues]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlight((h) => (h + 1) % Math.max(filteredSuggestions.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlight((h) => (h - 1 + filteredSuggestions.length) % Math.max(filteredSuggestions.length, 1));
      } else if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (filteredSuggestions[highlight]) {
          addAttachment(filteredSuggestions[highlight]);
        } else if (inputValue.trim()) {
          addAttachment(inputValue);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [addAttachment, filteredSuggestions, highlight, inputValue],
  );

  const handleSetHightLight = useCallback((idx: number) => setHighlight(idx), []);

  const handleRemoveAttachment = useCallback((idx: number) => () => removeAttachment(idx), [removeAttachment]);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setInputValue(e.target.value);
    setHighlight(0);
    setShowSuggestions(true);
  }, []);

  const handleInputClick = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  const shouldShowSuggestions = !allSelected && showSuggestions && filteredSuggestions.length > 0;

  return (
    <div className="flex flex-col w-full relative">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
      {allSelected ? (
        <div className="flex">
          <DialTag key="all-values" tag={allValueLabel || ''} remove={handleSelectNone} />
        </div>
      ) : (
        <div
          className={classNames(
            'flex flex-row gap-2 items-center',
            STANDARD_CONTROL_WIDTH,
            disable && 'pointer-events-none',
          )}
        >
          <div className={classNames('dial-input min-h-[40px] p-[6px]', CONTROL_WITH_BUTTON_WIDTH)}>
            <div
              ref={containerRef}
              className={classNames('flex flex-wrap items-start gap-2', wraps ? 'flex-col-reverse' : 'flex-row')}
            >
              {selected.map((att, idx) => (
                <DialTag key={att.value} tag={att.label} remove={handleRemoveAttachment(idx)} />
              ))}
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <input
                  value={inputValue}
                  onChange={handleInputChange}
                  onClick={handleInputClick}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className="outline-none border-none w-full flex-1 p-1 dial-input"
                  placeholder={placeholder || ''}
                />
              </div>
            </div>
          </div>
          {!allSelected && (
            <DialNeutralButton label={t(AttachmentsI18nKey.UseAll)} onClick={handleSelectAll} disabled={disable} />
          )}
          {!!selected.length && (
            <DialNeutralButton label={t(ButtonsI18nKey.None)} onClick={handleSelectNone} disabled={disable} />
          )}
        </div>
      )}

      {shouldShowSuggestions && (
        <Suggestions
          suggestions={filteredSuggestions}
          highlightIndex={highlight}
          onSelectSuggestion={addAttachment}
          onHightLightSuggestion={handleSetHightLight}
        />
      )}
    </div>
  );
};

export default AttachmentInput;
