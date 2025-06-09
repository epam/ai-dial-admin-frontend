import { FC, useCallback } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { createEndpoint, getModelAdapter } from '@/src/utils/adapter';

interface Props {
  model: DialModel;
  adapters: DialAdapter[];
  onChangeAdapter: (v: string) => void;
}

const AdapterSelector: FC<Props> = ({ adapters, onChangeAdapter, model }) => {
  const t = useI18n();

  const selectedAdapter = getModelAdapter(model, adapters);

  const items: DropdownItemsModel[] = adapters.map((adapter) => ({
    id: adapter.baseEndpoint as string,
    name: adapter.name as string,
  }));

  const onChange = useCallback(
    (endpoint: string) => {
      onChangeAdapter(createEndpoint(endpoint, model));
    },
    [model, onChangeAdapter],
  );

  return (
    <DropdownField
      selectedValue={selectedAdapter?.baseEndpoint}
      elementId="adapter"
      items={items}
      fieldTitle={t(CreateI18nKey.AdapterTitle)}
      placeholder={t(CreateI18nKey.AdapterPlaceholder)}
      onChange={onChange}
    />
  );
};

export default AdapterSelector;
