import { FC } from 'react';

import { SNIPPET_LANGUAGE_SHELL } from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import CodeSnippet from '@/src/components/Common/CodeSnippet/CodeSnippet';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  snippet: string;
  isBaseUrlPlaceholder: boolean;
}

/**
 * The REST endpoint export, with the replace-the-placeholder warning attached to it. Every REST example
 * on both tabs renders this block, so the warning has to travel with each copy of the export rather than
 * with one of them: `curl` cannot carry an inline default the way the Python examples can, which makes
 * the `curl` reader the one who most needs to be told the value is a placeholder.
 */
const ConnectRestEndpointSetup: FC<Props> = ({ snippet, isBaseUrlPlaceholder }) => {
  const t = useI18n();

  return (
    <>
      <CodeSnippet title={SNIPPET_LANGUAGE_SHELL} value={snippet} />
      {isBaseUrlPlaceholder && (
        <p className="dial-tiny-text text-warning">{t(AnalyticsTablesI18nKey.ConnectBaseUrlHint)}</p>
      )}
    </>
  );
};

export default ConnectRestEndpointSetup;
