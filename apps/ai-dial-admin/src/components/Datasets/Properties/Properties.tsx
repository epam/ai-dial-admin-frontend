'use client';

import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { Dataset } from '@/src/models/evaluation/dataset';

interface Props {
  dataset: Dataset;
  onChange: (dataset: Dataset) => void;
}

const DatasetProperties: FC<Props> = ({ dataset, onChange }) => {
  const onChangeName = useCallback(
    (name?: string) => {
      onChange({ ...dataset, name });
    },
    [dataset, onChange],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <DisplayNameControl displayName={dataset.name} required isFullWidth={false} onChange={onChangeName} />
      <DescriptionControl isFullWidth={false} entity={dataset} onChangeEntity={onChange} />
    </div>
  );
};

export default DatasetProperties;
