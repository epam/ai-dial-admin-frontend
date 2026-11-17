'use client';

import { FC, useState } from 'react';

import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import ColumnsForm from '@/src/components/Analytics/QueryBuilder/Chips/Columns/ColumnsForm';
import { ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { inSchemaOrder } from '@/src/components/Analytics/QueryBuilder/Chips/utils/columns';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { createColumnRow } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ColumnsPanel: FC<ChipPanelProps> = ({ titleId, onClose, onBack }) => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();
  const isEditing = state.select.length > 0;
  const [selected, setSelected] = useState(() => state.select.map((row) => row.field));

  const onApply = () => {
    patch({ select: inSchemaOrder(selected, state.fields).map(createColumnRow) });
    onClose();
  };

  const onRemove = () => {
    patch({ select: [] });
    onClose();
  };

  return (
    <ChipPopupPanel
      titleId={titleId}
      title={t(isEditing ? QueryChipsI18nKey.Columns : QueryChipsI18nKey.ShowColumns)}
      isApplyDisabled={!selected.length}
      onApply={onApply}
      onCancel={onClose}
      onBack={onBack}
      onRemove={isEditing ? onRemove : undefined}
    >
      <ColumnsForm selected={selected} fields={state.fields} onChange={setSelected} />
    </ChipPopupPanel>
  );
};

export default ColumnsPanel;
