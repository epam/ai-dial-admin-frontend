'use client';

import { ChangeEventHandler, FC, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialLabel, DialRadioButton, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { isEqual } from 'lodash';

import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import Suggestions from './Suggestions';

export enum AttachmentType {
  NONE = 'none',
  ALL = 'all',
  SPECIFIC = 'specific',
}

export interface AttachmentOption {
  label: string;
  value: string;
}

export interface Props {
  availableItems: AttachmentOption[];
  initialValues?: string[];
  placeholder?: string;
  label?: string;
  id?: string;
  required?: boolean;
  onChange?: (values?: string[]) => void;
}

const ALL_ATTACHMENTS_VALUE = [{ label: ALL_ATTACHMENTS, value: ALL_ATTACHMENTS }];

const AttachmentInput: FC<Props> = ({ availableItems, initialValues, label, placeholder, id, required, onChange }) => {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    if (!initialValues) return [];
    return initialValues
      .map((val) => availableItems.find((o) => o.value === val) || { label: val, value: val })
      .filter(Boolean) as AttachmentOption[];
  }, [availableItems, initialValues]);

  const selectedRadio = useMemo(() => {
    if (!initialValues) {
      return AttachmentType.NONE;
    } else {
      return isEqual(selected, ALL_ATTACHMENTS_VALUE) ? AttachmentType.ALL : AttachmentType.SPECIFIC;
    }
  }, [initialValues, selected]);

  const [inputValue, setInputValue] = useState('');
  const [wraps, setWraps] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filteredSuggestions = useMemo(() => {
    return availableItems
      .filter(
        (opt) =>
          !selected.some((s) => s.value === opt.value) &&
          (opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            opt.value.toLowerCase().includes(inputValue.toLowerCase())),
      )
      .slice(0, 5);
  }, [availableItems, inputValue, selected]);

  const shouldShowSuggestions = useMemo(() => {
    return selectedRadio === AttachmentType.SPECIFIC && showSuggestions && filteredSuggestions.length > 0;
  }, [filteredSuggestions.length, selectedRadio, showSuggestions]);

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

  const fireChange = useCallback(
    (items?: AttachmentOption[]) => {
      if (!items) {
        onChange?.(void 0);
        return;
      }
      onChange?.(items?.map((i) => i.value));
    },
    [onChange],
  );

  const setValues = useCallback(
    (value?: AttachmentOption[]) => {
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
      setValues(selected.filter((_, i) => i !== index));
    },
    [selected, setValues],
  );

  const handleRadioChange = useCallback(
    (option: AttachmentType) => {
      if (option === AttachmentType.NONE) {
        setValues(void 0);
      } else if (option === AttachmentType.SPECIFIC) {
        setValues([]);
      } else if (option === AttachmentType.ALL) {
        setValues(ALL_ATTACHMENTS_VALUE);
      }
    },
    [setValues],
  );

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

  const handleInputBlur = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  return (
    <div className="flex flex-col w-full relative gap-3">
      <DialLabel label={label} required={required} htmlFor={id} />

      <div className="flex flex-col gap-3">
        <DialRadioButton
          inputId={`${id}-none`}
          name={`${id}-attachment-options`}
          value={AttachmentType.NONE}
          checked={selectedRadio === AttachmentType.NONE}
          onChange={() => handleRadioChange(AttachmentType.NONE)}
          label={t(AttachmentsI18nKey.NoAttachments)}
        />

        <DialRadioButton
          inputId={`${id}-all`}
          name={`${id}-attachment-options`}
          value={AttachmentType.ALL}
          checked={selectedRadio === AttachmentType.ALL}
          onChange={() => handleRadioChange(AttachmentType.ALL)}
          label={t(AttachmentsI18nKey.AllAttachments)}
        />

        <DialRadioButton
          inputId={`${id}-specific`}
          name={`${id}-attachment-options`}
          value={AttachmentType.SPECIFIC}
          checked={selectedRadio === AttachmentType.SPECIFIC}
          onChange={() => handleRadioChange(AttachmentType.SPECIFIC)}
          label={t(AttachmentsI18nKey.SpecificAttachments)}
        />
      </div>

      {selectedRadio === AttachmentType.SPECIFIC && (
        <div className={classNames('flex flex-col', STANDARD_CONTROL_WIDTH)}>
          <div className="dial-input min-h-[40px] p-[6px]">
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
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className="outline-none border-none w-full flex-1 p-1 dial-input h-auto"
                  placeholder={placeholder || ''}
                />
              </div>
            </div>
          </div>

          {shouldShowSuggestions && (
            <Suggestions
              suggestions={filteredSuggestions}
              highlightIndex={highlight}
              onSelectSuggestion={addAttachment}
              onHightLightSuggestion={handleSetHightLight}
            />
          )}
          <div className="text-secondary tiny pt-2">{t(AttachmentsI18nKey.CaptionDescription)}</div>
        </div>
      )}
    </div>
  );
};

export default AttachmentInput;
