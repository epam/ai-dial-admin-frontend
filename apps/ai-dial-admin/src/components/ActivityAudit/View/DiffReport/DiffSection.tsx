import { FC, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { filterNotEmptySections, getDiffCount } from '@/src/components/ActivityAudit/View/DiffReport/utils';
import { CompareI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ActivityAuditDiffSection } from '@/src/models/dial/activity-audit';
import { ActivityAuditResourceType, CompareView, DiffStatus, DiffView } from '@/src/types/activity-audit';
import DiffLegend from '@/src/components/ActivityAudit/View/DiffReport/DiffLegend';
import AuditEntityGrid from '@/src/components/ActivityAudit/EntityGrid/EntityGrid';

interface Props {
  sections: ActivityAuditDiffSection[];
  name: string;
  type?: ActivityAuditResourceType;
  diffView?: DiffView;
  compareView?: CompareView;
}

const DiffSection: FC<Props> = ({ sections, name, type, diffView, compareView }) => {
  const t = useI18n();

  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const added = getDiffCount(sections, DiffStatus.ADDED);
  const changed = getDiffCount(sections, DiffStatus.CHANGED);
  const removed = getDiffCount(sections, DiffStatus.REMOVED);

  const validSections = filterNotEmptySections(sections, name, diffView, type);

  if (validSections.length === 0) return null;

  return (
    <div className="flex flex-col rounded border border-primary bg-layer-3 p-4">
      <button className="flex items-center justify-between" onClick={toggleCollapse}>
        <div className="flex flex-row">
          <i className="text-icon-secondary">
            {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
          </i>
          <h3 className="mx-2">{t(EntityFieldsI18nKey[name as keyof typeof EntityFieldsI18nKey])}</h3>
        </div>
        <DiffLegend added={added} changed={changed} removed={removed} />
      </button>
      <div className={classNames('flex flex-col gap-6 px-6 py-4', isCollapsed && 'hidden')}>
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
      </div>
    </div>
  );
};

export default DiffSection;
