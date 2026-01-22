import { FC } from 'react';

import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { CompareI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiffSection } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, CompareView, DiffStatus, DiffView } from '@/src/types/activity-audit';
import { filterNotEmptySections, getDiffCount } from '@/src/components/ActivityAudit/View/DiffReport/utils';
import { useI18n } from '@/src/locales/client';

import AuditEntityGrid from '@/src/components/ActivityAudit/EntityGrid/EntityGrid';
import DiffLegend from '@/src/components/ActivityAudit/View/DiffReport/DiffLegend';
import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  sections: ActivityAuditDiffSection[];
  name: string;
  type?: ActivityAuditResourceType;
  diffView?: DiffView;
  compareView?: CompareView;
}

const DiffSection: FC<Props> = ({ sections, name, type, diffView, compareView }) => {
  const t = useI18n();

  const added = getDiffCount(sections, DiffStatus.ADDED);
  const changed = getDiffCount(sections, DiffStatus.CHANGED);
  const removed = getDiffCount(sections, DiffStatus.REMOVED);

  const validSections = filterNotEmptySections(sections, name, diffView, type);

  if (validSections.length === 0) return null;

  const title =
    type === ActivityAuditResourceType.ROLE && name === EntityParameterKeys.ROLES
      ? t(EntityFieldsI18nKey.entities)
      : t(EntityFieldsI18nKey[name as keyof typeof EntityFieldsI18nKey]);

  return (
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
      {validSections.map(({ index, currentData, compareData }) => (
        <div key={index} className="flex flex-row gap-8">
          <div className="flex flex-col flex-1">
            <h4 className="mb-2 text-secondary">{t(CompareI18nKey.Before)}</h4>
            <AuditEntityGrid data={currentData} parameter={name} type={type} index={index} diffView={diffView} />
          </div>
          <div className="flex flex-col flex-1">
            <h4 className="mb-2 text-secondary">
              {compareView === CompareView.CURRENT ? t(CompareI18nKey.Current) : t(CompareI18nKey.After)}
            </h4>
            <AuditEntityGrid data={compareData} parameter={name} type={type} index={index} diffView={diffView} />
          </div>
        </div>
      ))}
    </Accordion>
  );
};

export default DiffSection;
