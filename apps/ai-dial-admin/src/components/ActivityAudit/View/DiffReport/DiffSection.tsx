import { FC } from 'react';

import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { getAnalyticsColumnHeading } from '@/src/components/ActivityAudit/View/utils/analytics-diffs';
import { AnalyticsTablesI18nKey, CompareI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiffSection, TranslateFn } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, CompareView, DiffStatus, DiffView } from '@/src/types/activity-audit';
import { InlineTextDiffSide } from '@/src/utils/diff/models';
import { filterNotEmptySections, getDiffCount } from '@/src/components/ActivityAudit/View/DiffReport/utils';
import { useI18n } from '@/src/locales/client';

import AuditEntityGrid from '@/src/components/ActivityAudit/EntityGrid/EntityGrid';
import DiffLegend from '@/src/components/Common/DiffLegend/DiffLegend';
import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  sections: ActivityAuditDiffSection[];
  name: string;
  type?: ActivityAuditResourceType;
  diffView?: DiffView;
  compareView?: CompareView;
}

const CONTAINER_SECTION_TITLE_KEYS: Record<string, EntityFieldsI18nKey> = {
  [EntityParameterKeys.RESOURCES]: EntityFieldsI18nKey.Compute,
  [EntityParameterKeys.SCALING]: EntityFieldsI18nKey.Autoscaling,
  [EntityParameterKeys.PROBE_PROPERTIES]: EntityFieldsI18nKey.StartupProbe,
  [EntityParameterKeys.METADATA]: EntityFieldsI18nKey.EnvironmentVariables,
  [EntityParameterKeys.ENDPOINT_CONFIGURATION]: EntityFieldsI18nKey.EndpointConfiguration,
  [EntityParameterKeys.CONFIGURATION]: EntityFieldsI18nKey.Configuration,
};

const ANALYTICS_SECTION_TITLE_KEYS: Record<string, AnalyticsTablesI18nKey> = {
  [EntityParameterKeys.COLUMNS]: AnalyticsTablesI18nKey.Columns,
};

const DIFF_STATUS_LABEL_KEYS: Partial<Record<DiffStatus, CompareI18nKey>> = {
  [DiffStatus.ADDED]: CompareI18nKey.Added,
  [DiffStatus.REMOVED]: CompareI18nKey.Removed,
  [DiffStatus.CHANGED]: CompareI18nKey.Changed,
};

const getSectionTitle = (t: TranslateFn, name: string, type?: ActivityAuditResourceType): string => {
  if (type === ActivityAuditResourceType.ROLE && name === EntityParameterKeys.ROLES) {
    return t(EntityFieldsI18nKey.entities);
  }
  const sectionKey = CONTAINER_SECTION_TITLE_KEYS[name] ?? ANALYTICS_SECTION_TITLE_KEYS[name];
  if (sectionKey) {
    return t(sectionKey);
  }
  return t(EntityFieldsI18nKey[name as keyof typeof EntityFieldsI18nKey]);
};

const DiffSection: FC<Props> = ({ sections, name, type, diffView, compareView }) => {
  const t = useI18n();

  const added = getDiffCount(sections, DiffStatus.ADDED);
  const changed = getDiffCount(sections, DiffStatus.CHANGED);
  const removed = getDiffCount(sections, DiffStatus.REMOVED);

  const validSections = filterNotEmptySections(sections, name, diffView, type);

  if (validSections.length === 0) return null;

  const title = getSectionTitle(t, name, type);

  return (
    <div
      data-diff-section=""
      data-diff-added={added > 0 ? '' : undefined}
      data-diff-changed={changed > 0 ? '' : undefined}
      data-diff-removed={removed > 0 ? '' : undefined}
    >
      <Accordion
        title={title}
        contentClassName="gap-y-8"
        containerClassName="bg-layer-3"
        actionButtons={
          <div className="flex items-center">
            <DiffLegend added={added} changed={changed} removed={removed} />
          </div>
        }
      >
        {validSections.map(({ index, label, diffStatus, currentData, compareData }) => {
          const groupHeading = getAnalyticsColumnHeading(t, label);
          const inlinePrefix = !groupHeading && name === EntityParameterKeys.METADATA ? `Variable ${index + 1} ` : '';
          const statusKey = diffStatus ? DIFF_STATUS_LABEL_KEYS[diffStatus] : void 0;
          const status = statusKey ? t(statusKey) : '';
          const groupLabel = [groupHeading ?? `${inlinePrefix}${title}`, status].filter(Boolean).join(', ');
          const compareLabel =
            compareView === CompareView.CURRENT ? t(CompareI18nKey.Current) : t(CompareI18nKey.After);
          return (
            <div key={index} role="group" aria-label={groupLabel} className="flex flex-col">
              {(groupHeading || status) && (
                <div className="flex flex-row items-center gap-2 mb-2">
                  {groupHeading && <h4>{groupHeading}</h4>}
                  {status && <span className="text-secondary small">{status}</span>}
                </div>
              )}
              <div className="flex flex-row gap-8">
                <div className="flex flex-col flex-1">
                  <h4 className="mb-2 text-secondary">{`${inlinePrefix}${t(CompareI18nKey.Before)}`}</h4>
                  <AuditEntityGrid
                    data={currentData}
                    parameter={name}
                    type={type}
                    index={index}
                    diffView={diffView}
                    diffSide={InlineTextDiffSide.Before}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <h4 className="mb-2 text-secondary">{`${inlinePrefix}${compareLabel}`}</h4>
                  <AuditEntityGrid
                    data={compareData}
                    parameter={name}
                    type={type}
                    index={index}
                    diffView={diffView}
                    diffSide={InlineTextDiffSide.After}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </Accordion>
    </div>
  );
};

export default DiffSection;
