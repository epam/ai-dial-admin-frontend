'use client';

import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { EntityFieldsI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DialModelResource, DialModelResourceType } from '@/src/models/dial/resource';

interface Props {
  entity: DialModel | DialModelResource;
  onChangeEntity: (type: string) => void;
  isAsset?: boolean;
}

const ModelTypeControl: FC<Props> = ({ entity, onChangeEntity, isAsset }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const modelTypeRadio: RadioButtonWithContent[] = [
    { id: isAsset ? DialModelResourceType.Chat : DialModelType.Chat, name: t(ModelViewI18nKey.Chat) },
    { id: isAsset ? DialModelResourceType.Embedding : DialModelType.Embedding, name: t(ModelViewI18nKey.Embedding) },
  ];

  return (
    <DialRadioGroup
      radioButtons={modelTypeRadio}
      activeRadioButton={entity.type as string}
      elementId="type"
      fieldTitle={t(EntityFieldsI18nKey.type)}
      orientation={RadioGroupOrientation.Row}
      onChange={onChangeEntity}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default ModelTypeControl;
