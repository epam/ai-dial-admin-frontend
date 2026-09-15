'use client';

import { FC } from 'react';

import { DialInput, DialTextarea } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  className?: string;
  /** Widths the field itself, leaving the caption free to run the container's full width. */
  wrapperClassName?: string;
  id: string;
  label: string;
  value?: string;
  sourceName?: string;
  description?: string;
  placeholder?: string;
  /** A single-line input, with the label carried as an accessible name rather than drawn. */
  isCompact?: boolean;
  isDisabled?: boolean;
  onChange: (value: string) => void;
}

/**
 * Uses the 1.0 textarea: the 2.0 replacement renders against theme tokens this deployment does not define
 * and falls back to a light palette, which is why no other call site in the repo uses it either.
 *
 * Deliberately unvalidated: the grammar is the service's, and a client-side approximation would reject
 * predicates the service accepts. An unparseable expression surfaces as the service's rejection on save.
 */
const SqlPredicateField: FC<Props> = ({
  className,
  wrapperClassName,
  id,
  label,
  value,
  sourceName,
  description,
  placeholder,
  isCompact,
  isDisabled,
  onChange,
}) => {
  const t = useI18n();

  const columnsFrom = sourceName
    ? `${t(AnalyticsPipelinesI18nKey.PredicateColumnsFrom)} ${sourceName}`
    : t(AnalyticsPipelinesI18nKey.PredicateSourceUnresolved);

  const caption = description ? `${description} ${columnsFrom}` : columnsFrom;

  // A readiness signal is one comparison — the live ones run to a few dozen characters — so it gets an
  // input. The textarea is for the predicates that do run long: a pipeline's filter, and a member
  // preference.
  if (isCompact) {
    return (
      <DialInput
        id={id}
        aria-label={label}
        value={value ?? ''}
        placeholder={placeholder}
        caption={caption}
        disabled={isDisabled}
        containerClassName={className}
        wrapperClassName={wrapperClassName}
        className="font-mono"
        spellCheck={false}
        onChange={(next) => onChange(next ?? '')}
      />
    );
  }

  return (
    <DialTextarea
      id={id}
      labelProps={{ label }}
      value={value ?? ''}
      placeholder={placeholder}
      caption={caption}
      containerClassName={className}
      className="font-mono"
      rows={3}
      spellCheck={false}
      onChange={onChange}
    />
  );
};

export default SqlPredicateField;
