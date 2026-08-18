import { FC } from 'react';

import {
  SNIPPET_LANGUAGE_PYTHON,
  SNIPPET_LANGUAGE_SHELL,
} from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import ConnectRestEndpointSetup from '@/src/components/Analytics/Tables/ConnectPanel/ConnectRestEndpointSetup';
import { ConnectFormatNote, ConnectFormatRule } from '@/src/components/Analytics/Tables/ConnectPanel/models';
import CodeSnippet from '@/src/components/Common/CodeSnippet/CodeSnippet';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  pythonSnippet: string;
  curlSnippet: string;
  restEndpointSnippet: string;
  formatNotes: ConnectFormatNote[];
  isBaseUrlPlaceholder: boolean;
  writeRoles: string[];
  isRolesLoading: boolean;
  isAccessReadable: boolean;
}

const FORMAT_RULE_KEY: Record<ConnectFormatRule, AnalyticsTablesI18nKey> = {
  [ConnectFormatRule.Timestamp]: AnalyticsTablesI18nKey.ConnectFormatTimestamp,
  [ConnectFormatRule.Date]: AnalyticsTablesI18nKey.ConnectFormatDate,
  [ConnectFormatRule.Decimal]: AnalyticsTablesI18nKey.ConnectFormatDecimal,
  [ConnectFormatRule.Array]: AnalyticsTablesI18nKey.ConnectFormatArray,
};

const ConnectWriteTab: FC<Props> = ({
  pythonSnippet,
  curlSnippet,
  restEndpointSnippet,
  formatNotes,
  isBaseUrlPlaceholder,
  writeRoles,
  isRolesLoading,
  isAccessReadable,
}) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectWhoCanWrite)}</h4>
        {isRolesLoading && (
          <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectRolesLoading)}</p>
        )}
        {!isRolesLoading && isAccessReadable && writeRoles.length > 0 && (
          <>
            <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectWriteRolesHint)}</p>
            <ul className="flex flex-wrap gap-1.5">
              {writeRoles.map((role) => (
                <li key={role} className="border border-secondary rounded bg-layer-3 px-2 py-0.5 font-mono tiny">
                  {role}
                </li>
              ))}
            </ul>
            <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectAdminWrites)}</p>
          </>
        )}
        {!isRolesLoading && isAccessReadable && !writeRoles.length && (
          <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectNoWriteRoles)}</p>
        )}
        {!isRolesLoading && !isAccessReadable && (
          <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectAdminWrites)}</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectPython)}</h4>
        <ConnectRestEndpointSetup snippet={restEndpointSnippet} isBaseUrlPlaceholder={isBaseUrlPlaceholder} />
        <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectPythonHint)}</p>
        <CodeSnippet title={SNIPPET_LANGUAGE_PYTHON} value={pythonSnippet} />
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectCurl)}</h4>
        <ConnectRestEndpointSetup snippet={restEndpointSnippet} isBaseUrlPlaceholder={isBaseUrlPlaceholder} />
        <CodeSnippet title={SNIPPET_LANGUAGE_SHELL} value={curlSnippet} />
      </section>

      {formatNotes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectFormats)}</h4>
          <ul className="flex flex-col gap-2">
            {formatNotes.map((note) => (
              <li key={note.rule} className="dial-tiny-text text-secondary border-l-2 border-tertiary pl-3">
                {t(FORMAT_RULE_KEY[note.rule], { columns: note.columns.join(', ') })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.ConnectBatchLimit)}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="dial-small-text-semi text-primary">{t(AnalyticsTablesI18nKey.ConnectRejected)}</h4>
        <ul className="flex flex-col gap-2">
          <li className="dial-tiny-text text-secondary border-l-2 border-tertiary pl-3">
            {t(AnalyticsTablesI18nKey.ConnectUnknownColumn)}
          </li>
          <li className="dial-tiny-text text-secondary border-l-2 border-tertiary pl-3">
            {t(AnalyticsTablesI18nKey.ConnectNotAuthorized)}
          </li>
        </ul>
      </section>
    </div>
  );
};

export default ConnectWriteTab;
