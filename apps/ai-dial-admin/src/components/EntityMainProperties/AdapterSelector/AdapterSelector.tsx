import { FC, useCallback } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

interface Props {
  model: DialModel;
  adapters: DialAdapter[];
  onChangeAdapter: (v: string) => void;
}

const AdapterSelector: FC<Props> = ({ adapters, onChangeAdapter, model }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = adapters.map((adapter) => ({
    id: adapter.name as string,
    name: (adapter.displayName || adapter.name) as string,
  }));

  const onChange = useCallback(
    (adapter: string) => {
      onChangeAdapter(adapter);
    },
    [onChangeAdapter],
  );

  return (
    <DropdownField
      selectedValue={model?.adapter}
      elementId="adapter"
      items={items}
      fieldTitle={t(CreateI18nKey.AdapterTitle)}
      placeholder={t(CreateI18nKey.AdapterPlaceholder)}
      onChange={onChange}
    />
  );
};

export default AdapterSelector;
