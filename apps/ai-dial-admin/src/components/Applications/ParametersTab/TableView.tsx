import { FC } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const TableView: FC = () => {
  const t = useI18n();

  return <DialNoDataContent title={t(BasicI18nKey.NoParameters)} />;
};

export default TableView;
