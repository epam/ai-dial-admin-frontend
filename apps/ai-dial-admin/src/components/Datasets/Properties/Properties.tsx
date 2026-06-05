'use client';

import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { Dataset } from '@/src/models/evaluation/dataset';

interface Props {
  dataset: Dataset;
  onChange: (dataset: Dataset) => void;
  isModal?: boolean;
  nameExistsError?: string;
}

const DatasetProperties: FC<Props> = ({ dataset, onChange, isModal, nameExistsError }) => {
  const onChangeName = useCallback(
    (name?: string) => {
      onChange({ ...dataset, name });
    },
    [dataset, onChange],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <DisplayNameControl
        isFullWidth={isModal}
        onChange={onChangeName}
        displayName={dataset.name}
        externalError={nameExistsError}
        required
      />
      <DescriptionControl isFullWidth={isModal} onChangeEntity={onChange} entity={dataset} />
    </div>
  );
};

export default DatasetProperties;
