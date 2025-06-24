import { FC, useCallback, useState } from 'react';

import classNames from 'classnames';

import { ParameterNamesI18nKey } from '@/src/components/ActivityAuditView/activity-audit';
import { getDiffCount } from '@/src/components/ActivityAuditView/activity-audit.utils';
import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ActivityAuditDiffSection } from '@/src/models/dial/activity-audit';
import { ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import ActivityAuditEntityDiffLegend from './ActivityAuditEntityDiffLegend';
import ActivityAuditEntityGrid from './ActivityAuditEntityGrid';

interface Props {
  sections: ActivityAuditDiffSection[];
  name: string;
  type?: ActivityAuditResourceType;
}

const ActivityAuditEntityDiffSection: FC<Props> = ({ sections, name, type }) => {
  const t = useI18n();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const added = getDiffCount(sections, DiffStatus.ADDED);
  const changed = getDiffCount(sections, DiffStatus.CHANGED);
  const removed = getDiffCount(sections, DiffStatus.REMOVED);

  return (
    <div className="flex flex-col rounded border border-primary bg-layer-3 p-4">
      <button className="flex items-center justify-between" onClick={toggleCollapse}>
        <div className="flex flex-row">
          <i className="text-icon-secondary">
            {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
          </i>
          <h3 className="mx-2"> {t(ParameterNamesI18nKey[name as keyof typeof ParameterNamesI18nKey])} </h3>
        </div>
        <ActivityAuditEntityDiffLegend added={added} changed={changed} removed={removed} />
      </button>
      <div className={classNames('flex flex-col gap-6 px-6 py-4', isCollapsed && 'hidden')}>
        {sections.map((item, index) => (
          <div key={index} className="flex flex-row gap-8">
            <div className="flex flex-col flex-1">
              <h4 className="mb-2 text-secondary">{t(BasicI18nKey.Before)}</h4>
              <ActivityAuditEntityGrid data={item.current} parameter={name} type={type} index={index} />
            </div>
            <div className="flex flex-col flex-1">
              <h4 className="mb-2 text-secondary">{t(BasicI18nKey.After)}</h4>
              <ActivityAuditEntityGrid data={item.compare} parameter={name} type={type} index={index} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityAuditEntityDiffSection;
