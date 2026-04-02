import { FC, ReactNode, useMemo, useState } from 'react';
import { DialGhostIconButton, DialTabs, ElementSize, TabModel } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { getSectionTabs, SectionView } from '../constants';
import SchemaViewer from './SchemaViewer';
import { IconMaximize } from '@tabler/icons-react';
import { TestSuitesI18nKey } from '../../../../../constants/i18n';

interface Props {
  title: string;
  schema?: object;
  controlsContent: ReactNode;
}

const MetricSectionTabs: FC<Props> = ({ title, schema, controlsContent }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<SectionView>(SectionView.Controls);
  const [isFullscreen, setFullScreen] = useState(false);
  const tabs: TabModel[] = useMemo(() => getSectionTabs(t), [t]);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col justify-between">
        <h4 className="dial-small-semi mb-4">{title}</h4>

        <div className="flex flex-row items-center justify-between w-full">
          <DialTabs tabs={tabs} activeTab={activeTab} onClick={(id) => setActiveTab(id as SectionView)} />

          {activeTab === SectionView.Schema && (
            <DialGhostIconButton
              size={ElementSize.Small}
              icon={<IconMaximize size={16} />}
              onClick={() => setFullScreen(true)}
            />
          )}
        </div>
      </div>
      {activeTab === SectionView.Controls ? (
        controlsContent
      ) : (
        <SchemaViewer
          schema={schema}
          title={`${title} ${t(TestSuitesI18nKey.Schema)}`}
          isFullscreen={isFullscreen}
          setFullScreen={setFullScreen}
        />
      )}
    </div>
  );
};

export default MetricSectionTabs;
