'use client';

import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import { isEqual } from 'lodash';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import Field from '@/src/components/Common/Field/Field';
import Tag from '@/src/components/Common/TagInput/Tag';
import { AttachmentsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';

export interface AttachmentOption {
  label: string;
  value: string;
}

interface Props {
  availableItems: AttachmentOption[];
  initialValues?: string[];
  placeholder?: string;
  fieldTitle?: string;
  allValueLabel?: string;
  elementId?: string;
  optional?: boolean;
  disable?: boolean;
  inputClass?: string;
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
  inputClass,
  onChange,
}) => {
  const t = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<AttachmentOption[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [wraps, setWraps] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const allSelected = isEqual(selected, ALL_ATTACHMENTS_VALUE);

  const fireChange = (items: AttachmentOption[]) => {
    onChange?.(items.map((i) => i.value));
  };

  const filteredSuggestions = availableItems
    .filter(
      (opt) =>
        !selected.some((s) => s.value === opt.value) &&
        (opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())),
    )
    .slice(0, 5);

  useEffect(() => {
    if (
      !isEqual(
        initialValues,
        selected.map((s) => s.value),
      )
    ) {
      if (initialValues.length === 1 && initialValues[0] === ALL_ATTACHMENTS) {
        setValues(ALL_ATTACHMENTS_VALUE);
      } else {
        const initial = initialValues
          .map((val) => availableItems.find((o) => o.value === val) || { label: val, value: val })
          .filter(Boolean) as AttachmentOption[];
        setSelected(initial);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const hasWrapped = containerRef.current.scrollHeight > containerRef.current.clientHeight + 10;
        setWraps(hasWrapped);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const setValues = (value: AttachmentOption[]) => {
    setSelected(value);
    fireChange(value);
    setInputValue('');
    setShowSuggestions(false);
  };

  const addAttachment = (item?: AttachmentOption | string) => {
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
  };

  const removeAttachment = (index: number) => {
    if (allSelected) {
      setValues([]);
      return;
    }

    setValues(selected.filter((_, i) => i !== index));
  };

  const handleSelectAll = () => {
    if (allSelected) return;
    setValues(ALL_ATTACHMENTS_VALUE);
  };

  const handleSelectNone = () => {
    setValues([]);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
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
  };

  return (
    <div className="flex flex-col w-full relative">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
      {allSelected ? (
        <div className="flex">
          <Tag key="all-values" tag={allValueLabel || ''} remove={() => removeAttachment(0)} />
        </div>
      ) : (
        <div className={classNames('flex flex-row gap-2 items-center w-full', disable && 'pointer-events-none')}>
          <div className={classNames('input min-h-[38px] p-[6px]', inputClass)}>
            <div
              ref={containerRef}
              className={classNames('flex flex-wrap items-start gap-2', wraps ? 'flex-col-reverse' : 'flex-row')}
            >
              {selected.map((att, idx) => (
                <Tag key={att.value} tag={att.label} remove={() => removeAttachment(idx)} />
              ))}
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                    setHighlight(0);
                  }}
                  onFocus={() => {
                    if (filteredSuggestions.length) setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className="outline-none border-none w-full flex-1 p-1"
                  placeholder={placeholder || ''}
                />
              </div>
            </div>
          </div>
          {!allSelected && (
            <DialButton
              variant={ButtonVariant.Secondary}
              title={t(AttachmentsI18nKey.UseAll)}
              onClick={handleSelectAll}
              disable={disable}
            />
          )}
          {!!selected.length && (
            <DialButton
              variant={ButtonVariant.Secondary}
              title={t(ButtonsI18nKey.None)}
              onClick={handleSelectNone}
              disable={disable}
            />
          )}
        </div>
      )}
      {!allSelected && showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="relative mt-1 w-full bg-layer-0 z-20">
          {filteredSuggestions.map((opt, idx) => (
            <li
              key={opt.value}
              className={classNames(
                'cursor-pointer px-3 py-2 flex justify-between gap-4',
                idx === highlight && 'bg-accent-primary-alpha',
              )}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                addAttachment(opt);
              }}
            >
              <span className="small">{opt.label.toUpperCase()}</span>
              <span className="small text-secondary truncate">{opt.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentInput;
