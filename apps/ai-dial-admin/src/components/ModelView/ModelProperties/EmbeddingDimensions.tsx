'use client';

import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props<T> {
  model: T;
  onChangeModel: (model: T) => void;
}

const EmbeddingDimensions = <T extends { embeddingDimensions?: number }>({ model, onChangeModel }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <DialNumberInput
      id="embeddingDimensions"
      value={model.embeddingDimensions}
      onChange={(value) => onChangeModel({ ...model, embeddingDimensions: value as number | undefined })}
      labelProps={{ label: t(EntityFieldsI18nKey.embeddingDimensions) }}
      placeholder={t(EntityPlaceholdersI18nKey.EmbeddingDimensions)}
      className="w-[220px]"
      containerClassName="w-[220px]"
      disabled={isReadOnlyAdmin}
    />
  );
};

export default EmbeddingDimensions;
