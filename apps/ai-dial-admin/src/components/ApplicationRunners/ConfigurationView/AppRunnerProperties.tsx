import { FC, useCallback, useState } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { CreateI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForAppRunnerId } from './AppRunnerProperties.utils';

interface Props {
  entity: DialApplicationScheme;
  isImmutable?: boolean;
  onChangeScheme: (entity: DialApplicationScheme) => void;
}

const SchemeProperties: FC<Props> = ({ entity, isImmutable, onChangeScheme }) => {
  const t = useI18n() as (t: string) => string;

  const [idError, setIdError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  const onChangeId = useCallback(
    (id: string) => {
      setIdError(getErrorForAppRunnerId(id, t));
      onChangeScheme({
        ...entity,
        $id: id.trim(),
      });
    },
    [onChangeScheme, entity, t],
  );

  const onChangeDescription = useCallback(
    (description: string) => {
      setDescriptionError(getErrorForDescription(description, t));
      onChangeScheme({ ...entity, description });
    },
    [entity, onChangeScheme, t],
  );

  const onChangeName = useCallback(
    (name: string) => {
      onChangeScheme({ ...entity, 'dial:applicationTypeDisplayName': name });
    },
    [entity, onChangeScheme],
  );

  const onChangeTopics = useCallback(
    (topics: string[]) => {
      onChangeScheme({ ...entity, topics });
    },
    [entity, onChangeScheme],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <TextInputField
        elementId="id"
        fieldTitle={t(CreateI18nKey.IdTitle)}
        placeholder={t(CreateI18nKey.IdPlaceholder)}
        value={entity.$id}
        errorText={idError?.text}
        invalid={!!idError}
        onChange={onChangeId}
        disabled={isImmutable}
        iconAfterInput={isImmutable && <CopyButton field={entity.$id} title={t(CreateI18nKey.IdTitle)} />}
      />

      <TextInputField
        elementId="name"
        fieldTitle={t(CreateI18nKey.NameTitle)}
        placeholder={t(CreateI18nKey.NamePlaceholder)}
        value={entity['dial:applicationTypeDisplayName']}
        onChange={onChangeName}
      />

      <TextAreaField
        elementId="description"
        fieldTitle={t(CreateI18nKey.DescriptionTitle)}
        placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
        optional={true}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        value={entity.description}
        onChange={onChangeDescription}
      />

      {isImmutable && (
        <Multiselect
          elementId="topics"
          selectedItems={entity.topics}
          getItems={getModelsTopics}
          onChangeItems={onChangeTopics}
          heading={t(TopicsI18nKey.Topics)}
          title={t(TopicsI18nKey.Topics)}
          addPlaceholder={t(TopicsI18nKey.AddTopicPlaceholder)}
          addTitle={t(TopicsI18nKey.AddTopic)}
        />
      )}
    </div>
  );
};

export default SchemeProperties;
