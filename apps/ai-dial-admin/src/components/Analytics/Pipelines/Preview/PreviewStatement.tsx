'use client';

import { FC, useMemo } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  statement: string;
}

/**
 * The statement the service ran, drawn like the sections of the Properties tab. It is shown formatted for
 * reading and copied exactly as the service sent it, so a statement run by hand reads the same rows.
 */
const PreviewStatement: FC<Props> = ({ statement }) => {
  const t = useI18n();

  const formatted = useMemo(() => formatSql(statement), [statement]);

  return (
    <Accordion
      title={t(PipelinePreviewI18nKey.StatementTitle)}
      description={t(PipelinePreviewI18nKey.StatementDescription)}
      collapsed={false}
      actionButtons={
        <div className="shrink-0 whitespace-nowrap">
          <CopyButton
            buttonLabel={t(PipelinePreviewI18nKey.CopySql)}
            valueLabel={t(PipelinePreviewI18nKey.SqlLabel)}
            value={statement}
            size={ElementSize.Small}
          />
        </div>
      }
    >
      <pre className="overflow-x-auto rounded border border-secondary bg-layer-3 px-3 py-2.5 font-mono dial-tiny-text text-primary">
        {formatted}
      </pre>
    </Accordion>
  );
};

export default PreviewStatement;
