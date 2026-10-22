'use client';

import { FC, useEffect, useState } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import { COMPARE_RUN_PICKER_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { CompareCandidateRun } from '@/src/components/Runs/Compare/models';
import { ButtonsI18nKey, EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isModalOpen: boolean;
  runs: CompareCandidateRun[];
  selectedRunId?: string;
  isLoading?: boolean;
  onClose: () => void;
  onApply: (runId: string) => void;
}

const SelectCompareRunModal: FC<Props> = ({ isModalOpen, runs, selectedRunId, isLoading, onClose, onApply }) => {
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
    <Popup
      open={isModalOpen}
      onClose={onClose}
      header={t(RunsI18nKey.RunCompareSelectRun)}
      portalId="SelectCompareRunModal"
      size={PopupSize.Lg}
      className="h-[750px]"
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Confirm),
        isSubmitDisabled: !selectedRunIdState,
        onCancel: onClose,
        onSubmit: onSubmit,
      })}
    >
      <div className="flex flex-col px-6 py-4 h-full min-h-0">
        <RadioSelectGrid
          data={runs}
          columnDefs={COMPARE_RUN_PICKER_COLUMN}
          idField="id"
          selectedId={selectedRunIdState}
          onSelect={(run) => setSelectedRunIdState(run.id)}
          emptyTitle={t(EntitiesI18nKey.NoRuns)}
          isLoading={isLoading}
        />
      </div>
    </Popup>
  );
};

export default SelectCompareRunModal;
