import { FC } from 'react';

import {
  SNIPPET_LANGUAGE_PYTHON,
  SNIPPET_LANGUAGE_SHELL,
} from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import CodeSnippet from '@/src/components/Common/CodeSnippet/CodeSnippet';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  pythonSnippet: string;
  curlSnippet: string;
  flightInstallSnippet: string;
  flightSnippet: string;
}

const ConnectReadTab: FC<Props> = ({ pythonSnippet, curlSnippet, flightInstallSnippet, flightSnippet }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectWhoCanRead)}</h4>
        <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectReadScope)}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectRowLimits)}</h4>
        <ul className="flex flex-col gap-2">
          <li className="dial-tiny-text text-secondary border-l-2 border-tertiary pl-3">
            {t(AnalyticsTablesI18nKey.ConnectRestLimits)}
          </li>
          <li className="dial-tiny-text text-secondary border-l-2 border-tertiary pl-3">
            {t(AnalyticsTablesI18nKey.ConnectFlightLimits)}
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectPython)}</h4>
        <CodeSnippet title={SNIPPET_LANGUAGE_PYTHON} value={pythonSnippet} />
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectCurl)}</h4>
        <CodeSnippet title={SNIPPET_LANGUAGE_SHELL} value={curlSnippet} />
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectFlight)}</h4>
        <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectFlightHint)}</p>
        <CodeSnippet title={SNIPPET_LANGUAGE_SHELL} value={flightInstallSnippet} />
        <CodeSnippet title={SNIPPET_LANGUAGE_PYTHON} value={flightSnippet} />
        <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectFlightReadOnly)}</p>
      </section>
    </div>
  );
};

export default ConnectReadTab;
