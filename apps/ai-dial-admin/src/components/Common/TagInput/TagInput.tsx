'use client';

import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import { PlaceholderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import Tag from './Tag';

interface Props {
  initialTags?: string[];
  placeholder?: string;
  fieldTitle?: string;
  elementId?: string;
  optional?: boolean;
  errorText?: string;
  invalid?: boolean;
  onChange?: (tags: string[]) => void;
}

const TagInput: FC<Props> = ({
  initialTags = [],
  fieldTitle,
  optional,
  elementId,
  placeholder,
  errorText,
  invalid,
  onChange,
}) => {
  const t = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [wraps, setWraps] = useState(false);

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,$/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [trimmed, ...tags];
      setTags(newTags);
      onChange?.(newTags);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    onChange?.(newTags);
  };

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        const hasWrapped = containerRef.current.scrollHeight > containerRef.current.clientHeight + 10;
        setWraps(hasWrapped);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [tags]);

  return (
    <div className={classNames('flex flex-col w-full')}>
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
      <div className={classNames('input min-h-[38px] p-[6px]', invalid && 'input-error')}>
        <div
          ref={containerRef}
          className={classNames('flex flex-wrap items-start gap-2', wraps ? 'flex-col-reverse' : 'flex-row')}
        >
          {tags.map((tag, index) => (
            <Tag key={tag + index} tag={tag} remove={() => handleRemove(index)} />
          ))}

          <input
            data-testid="tag-input"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={classNames('outline-none border-none w-full min-w-[100px] flex-1 p-1')}
            placeholder={placeholder || t(PlaceholderI18nKey.TagsInput)}
          />
        </div>
      </div>
      <ErrorText errorText={errorText} />
    </div>
  );
};

export default TagInput;
