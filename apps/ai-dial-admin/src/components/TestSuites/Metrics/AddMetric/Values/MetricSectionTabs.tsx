import { FC, ReactNode, useCallback, useMemo, useState } from 'react';

import { DialSelect, Badge, Tooltip, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';

import { getSectionViewOptions, SectionView } from '@/src/components/TestSuites/Metrics/AddMetric/constants';
import { CompareI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import SchemaViewer from './SchemaViewer';

interface Props {
  title: string;
  schema?: object;
  controlsContent: ReactNode;
}

const MetricSectionTabs: FC<Props> = ({ title, schema, controlsContent }) => {
  const t = useI18n();
  const [activeView, setActiveView] = useState<SectionView>(SectionView.Controls);
  const viewOptions: SelectOption[] = useMemo(() => getSectionViewOptions(t), [t]);

  const onViewChange = useCallback((value: string | string[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    setActiveView(v as SectionView);
  }, []);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <h4 className="dial-small-semi">{title}</h4>
        <div className="flex flex-row items-center gap-3">
          {activeView === SectionView.Schema && (
            <Tooltip tooltip={t(TestSuitesI18nKey.SchemaReadOnlyDescription)} triggerClassName="flex items-center">
              <Badge label={t(TestSuitesI18nKey.SchemaReadOnlyBadge)} />
            </Tooltip>
          )}
          <div className="w-fit shrink-0">
            <DialSelect
              prefix={`${t(CompareI18nKey.View)}: `}
              size={SelectSize.Sm}
              variant={SelectVariant.Secondary}
              options={viewOptions}
              value={activeView}
              onChange={onViewChange}
              className="!w-auto !border-0 !gap-1 rounded"
            />
          </div>
        </div>
      </div>
      {activeView === SectionView.Controls ? controlsContent : <SchemaViewer schema={schema} />}
    </div>
  );
};

export default MetricSectionTabs;
