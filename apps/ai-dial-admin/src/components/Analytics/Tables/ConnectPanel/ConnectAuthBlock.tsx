import { FC } from 'react';

import CodeSnippet from '@/src/components/Common/CodeSnippet/CodeSnippet';
import { SNIPPET_LANGUAGE_SHELL } from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  snippet: string;
  isBaseUrlPlaceholder: boolean;
}

const ConnectAuthBlock: FC<Props> = ({ snippet, isBaseUrlPlaceholder }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-2">
      <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectAuth)}</h4>
      <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectAuthHint)}</p>
      <CodeSnippet title={SNIPPET_LANGUAGE_SHELL} value={snippet} />
      {isBaseUrlPlaceholder && (
        <p className="dial-tiny-text text-warning">{t(AnalyticsTablesI18nKey.ConnectBaseUrlHint)}</p>
      )}
    </div>
  );
};

export default ConnectAuthBlock;
