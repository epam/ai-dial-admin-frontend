'use client';

import { FC } from 'react';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { getHeaderClassName } from '@/src/utils/entities/view';

interface Props {
  run: Run;
}

const RunView: FC<Props> = ({ run }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(false)}>
        <ReadonlyId value={run.id || ''} />
      </div>
      <div className="flex flex-col gap-4">
        {run.testRunName != null && <LabelledText label={t(RunsI18nKey.TestRunName)} text={run.testRunName} />}
        {run.runConfig?.numberOfRuns != null && (
          <LabelledText label={t(RunsI18nKey.NumberOfRuns)} text={String(run.runConfig.numberOfRuns)} />
        )}
        {run.numberOfTestCases != null && (
          <LabelledText label={t(RunsI18nKey.NumberOfTestCases)} text={String(run.numberOfTestCases)} />
        )}
        {run.startedAt != null && <LabelledText label={t(RunsI18nKey.StartDate)} text={run.startedAt} />}
        {run.completedAt != null && <LabelledText label={t(RunsI18nKey.EndDate)} text={run.completedAt} />}
        {run.status != null && <LabelledText label={t(EntityFieldsI18nKey.status)} text={run.status} />}
      </div>
    </div>
  );
};

export default RunView;
