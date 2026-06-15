'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialLoader, DialNeutralButton, DialPopup, DialPrimaryButton, PopupSize } from '@epam/ai-dial-ui-kit';
import { RowClickedEvent } from 'ag-grid-community';

import { getDatasets } from '@/src/app/[lang]/datasets/actions';
import ListEntities from '@/src/components/ListView/List';
import { DATASETS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (datasetId: string) => void;
}

const PickPublicDataset: FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const t = useI18n();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getDatasets(0, 1000, [], [])
      .then((res) => {
        setDatasets(res?.content ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const onRowClicked = useCallback((event: RowClickedEvent<Dataset>) => {
    setSelectedDataset(event.data ?? null);
  }, []);

  const onConfirmClick = useCallback(() => {
    if (selectedDataset?.id) {
      onConfirm(selectedDataset.id);
    }
  }, [selectedDataset, onConfirm]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.AttachDataset)}
      portalId="PickPublicDatasetModal"
      open={isOpen}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col h-[400px] py-4 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <DialLoader size={40} />
          </div>
        ) : (
          <ListEntities
            rowData={datasets}
            columnDefs={DATASETS_COLUMN}
            additionalGridOptions={{
              rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
              onRowClicked,
            }}
          />
        )}
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4 border-t border-primary flex-shrink-0">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialPrimaryButton label={t(ButtonsI18nKey.Confirm)} onClick={onConfirmClick} disabled={!selectedDataset} />
      </div>
    </DialPopup>
  );
};

export default PickPublicDataset;
