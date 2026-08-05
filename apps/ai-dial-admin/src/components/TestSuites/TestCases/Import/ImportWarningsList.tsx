'use client';

import { FC } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CaseWarning } from './models';

interface Props {
  warnings?: CaseWarning[];
}

const ImportWarningsList: FC<Props> = ({ warnings }) => {
  const t = useI18n();

  if (!warnings?.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="dial-small-sime-text text-secondary">{t(TestSuitesI18nKey.ImportWarnings)}</span>
      <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
        {warnings.map((warning) => (
          <span key={`${warning.rowNumber}-${warning.columnName}`} className="dial-small-sime-text text-warning">
            {`${t(TestSuitesI18nKey.ImportWarningRow, { rowNumber: warning.rowNumber })} · ${warning.columnName}: ${warning.message}`}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ImportWarningsList;
