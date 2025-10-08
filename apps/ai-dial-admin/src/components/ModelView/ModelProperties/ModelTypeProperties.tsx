'use client';

import { FC, useCallback } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { useI18n } from '@/src/locales/client';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const ModelTypeProperties: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();

  const onChangeOverrideName = useCallback(
    (overrideName?: string) => {
      onChangeModel({ ...model, overrideName });
    },
    [model, onChangeModel],
  );
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full flex flex-col gap-6 lg:w-[35%]">
        <DialTextInputField
          elementId="overrideName"
          fieldTitle={t(EntityFieldsI18nKey.overrideName)}
          placeholder={t(EntityPlaceholdersI18nKey.OverrideName)}
          value={model.overrideName}
          onChange={onChangeOverrideName}
          optional={true}
        />
        {model.type === DialModelType.Chat && (
          <>
            <IconControl iconUrl={model.iconUrl} onChange={(icon) => onChangeModel({ ...model, iconUrl: icon })} />
            <TopicsControl entity={model} onChange={onChangeModel} />
          </>
        )}
      </div>
      {model.type === DialModelType.Chat && <EntityAttachments entity={model} onChangeEntity={onChangeModel} />}
    </div>
  );
};

export default ModelTypeProperties;
