'use client';

import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import IconControl from '@/src/components/BaseControls/Icon';
import TopicsControl from '@/src/components/BaseControls/Topics';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialModel, DialModelType } from '@/src/models/dial/model';

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
    <div className="w-full flex flex-col gap-y-8">
      <DialInput
        containerClassName={STANDARD_CONTROL_WIDTH}
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
          <EntityAttachments entity={model} onChangeEntity={onChangeModel} />
        </>
      )}
    </div>
  );
};

export default ModelTypeProperties;
