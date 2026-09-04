'use client';

import { FC } from 'react';

import { DialTextarea } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  className?: string;
  id: string;
  label: string;
  value?: string;
  sourceName?: string;
  description?: string;
  onChange: (value: string) => void;
}

/**
 * Uses the 1.0 textarea: the 2.0 replacement renders against theme tokens this deployment does not define
 * and falls back to a light palette, which is why no other call site in the repo uses it either.
 *
 * Deliberately unvalidated: the grammar is the service's, and a client-side approximation would reject
 * predicates the service accepts. An unparseable expression surfaces as the service's rejection on save.
 */
const SqlPredicateField: FC<Props> = ({ className, id, label, value, sourceName, description, onChange }) => {
  const t = useI18n();

  const columnsFrom = sourceName
    ? `${t(AnalyticsPipelinesI18nKey.PredicateColumnsFrom)} ${sourceName}`
    : t(AnalyticsPipelinesI18nKey.PredicateSourceUnresolved);

  return (
    <DialTextarea
      id={id}
      labelProps={{ label }}
      value={value ?? ''}
      caption={description ? `${description} ${columnsFrom}` : columnsFrom}
      containerClassName={className}
      className="font-mono"
      rows={3}
      spellCheck={false}
      onChange={onChange}
    />
  );
};

export default SqlPredicateField;
