'use client';

import { FC, useState } from 'react';

import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import CreateAggregatePopup from '@/src/components/Analytics/Pipelines/Aggregate/CreateAggregatePopup';
import CreateEnrichPopup from '@/src/components/Analytics/Pipelines/Enrich/CreateEnrichPopup';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';

interface Props {
  functions: QueryFunction[];
  takenTargets: string[];
  onClose: () => void;
  onCreated: () => void;
}

const CreatePipelinePopup: FC<Props> = ({ functions, takenTargets, onClose, onCreated }) => {
  const t = useI18n();
  const [kind, setKind] = useState<PipelineKind>(PipelineKind.Enrich);

  const kindRadios: RadioButtonWithContent[] = [
    { id: PipelineKind.Enrich, name: t(AnalyticsPipelinesI18nKey.KindEnrich) },
    { id: PipelineKind.Aggregate, name: t(AnalyticsPipelinesI18nKey.KindAggregate) },
  ];

  const kindControl = (
    <DialRadioGroup
      elementId="pipeline-kind"
      fieldTitle={t(AnalyticsPipelinesI18nKey.Kind)}
      orientation={RadioGroupOrientation.Column}
      radioButtons={kindRadios}
      activeRadioButton={kind}
      onChange={(id) => setKind(id as PipelineKind)}
    />
  );

  if (kind === PipelineKind.Aggregate) {
    return (
      <CreateAggregatePopup
        kindControl={kindControl}
        functions={functions}
        takenTargets={takenTargets}
        onClose={onClose}
        onCreated={onCreated}
      />
    );
  }

  return (
    <CreateEnrichPopup kindControl={kindControl} takenTargets={takenTargets} onClose={onClose} onCreated={onCreated} />
  );
};

export default CreatePipelinePopup;
