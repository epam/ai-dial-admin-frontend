'use client';
import { FC } from 'react';
import { Textarea } from '@epam/ai-dial-ui-kit';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
interface Props {
  value?: string;
  onChange: (value: string) => void;
}
/**
 * Deliberately unvalidated and unformatted: the service parses the statement, judges it and stores it
 * verbatim, so a client-side check would refuse what it accepts and a formatter would rewrite what it serves.
 * Uses the 1.0 textarea for the same reason `SqlPredicateField` does.
 */
const SqlDeclarationEditor: FC<Props> = ({ value, onChange }) => {
  const t = useI18n();
  return (
    <Textarea
      id="aggregate-sql-declaration"
      labelProps={{ label: t(AnalyticsPipelinesI18nKey.SqlDeclaration) }}
      value={value ?? ''}
      placeholder={t(AnalyticsPipelinesI18nKey.SqlDeclarationPlaceholder)}
      caption={t(AnalyticsPipelinesI18nKey.SqlDeclarationCaption)}
      className="font-mono"
      rows={12}
      spellCheck={false}
      onChange={onChange}
    />
  );
};
export default SqlDeclarationEditor;
