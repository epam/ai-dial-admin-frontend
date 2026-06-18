'use client';

import { FC, useEffect, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import { RUNS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

interface Props {
  isModalOpen: boolean;
  runs: Run[];
  selectedRunId?: string;
  onClose: () => void;
  onApply: (runId: string) => void;
}

const SelectCompareRunModal: FC<Props> = ({ isModalOpen, runs, selectedRunId, onClose, onApply }) => {
  const t = useI18n();
  const [selectedRunIdState, setSelectedRunIdState] = useState<string | undefined>();

  useEffect(() => {
    if (isModalOpen) {
      setSelectedRunIdState(selectedRunId);
    }
  }, [isModalOpen, selectedRunId]);

  const onSubmit = () => {
    if (selectedRunIdState) {
      onApply(selectedRunIdState);
    }
  };

  return (
    <DialFormPopup
      open={isModalOpen}
      onClose={onClose}
      header={t(RunsI18nKey.RunCompareSelectRun)}
      portalId="SelectCompareRunModal"
      size={PopupSize.Lg}
      className="h-[750px]"
      submitLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onSubmit={onSubmit}
      onCancel={onClose}
      disableSubmitButton={!selectedRunIdState}
    >
      <div className="flex flex-col px-6 py-4 h-full min-h-0">
        <RadioSelectGrid
          data={runs}
          columnDefs={RUNS_COLUMN}
          idField="id"
          selectedId={selectedRunIdState}
          onSelect={(run) => setSelectedRunIdState(run.id)}
          emptyTitle={t(EntitiesI18nKey.NoRuns)}
        />
      </div>
    </DialFormPopup>
  );
};

export default SelectCompareRunModal;
