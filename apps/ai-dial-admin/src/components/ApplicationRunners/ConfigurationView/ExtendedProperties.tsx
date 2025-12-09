import { FC, useCallback } from 'react';

import { DialSelectField, DialTextInputField, SelectOption } from '@epam/ai-dial-ui-kit';

import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import EditorUrlControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/EditorUrl';
import ViewerUrlControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ViewerUrl';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme, TypeBucketCopy, TypeEntity } from '@/src/models/dial/application';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerExtendedProperties: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n();
  const types: SelectOption[] = [
    { value: BasicI18nKey.None, label: t(BasicI18nKey.None) },
    { value: TypeEntity.OBJECT, label: t(TypeI18nKey.Object) },
    { value: TypeEntity.BOOLEAN, label: t(TypeI18nKey.Boolean) },
  ];

  const typeBucketCopy: SelectOption[] = [
    { value: TypeBucketCopy.ENABLED, label: t(BasicI18nKey.Enabled) },
    { value: TypeBucketCopy.DISABLED, label: t(BasicI18nKey.Disabled) },
  ];

  const onChange = useCallback(
    (value: string | string[] | boolean | undefined, key: keyof DialApplicationScheme) => {
      onChangeRunner({ ...runner, [key]: value });
    },
    [runner, onChangeRunner],
  );

  const onChangeTypeCopyBucket = useCallback(
    (value?: string) => {
      onChange(value, 'dial:applicationTypeBucketCopy');
    },
    [onChange],
  );

  const onChangeCompletionEndPoint = useCallback(
    (endpoint?: string) => {
      onChange(endpoint, 'dial:applicationTypeCompletionEndpoint');
    },
    [onChange],
  );

  const onChangeViewerUrl = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeViewerUrl');
    },
    [onChange],
  );

  const onChangeEditorUrl = useCallback(
    (url?: string) => {
      onChange(url, 'dial:applicationTypeEditorUrl');
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-y-8 h-full">
      <IconControl
        iconUrl={runner['dial:applicationTypeIconUrl']}
        onChange={(icon: string) => {
          onChange(icon, 'dial:applicationTypeIconUrl');
        }}
      />
      <DialTextInputField
        elementId="title"
        fieldTitle={t(EntityFieldsI18nKey.title)}
        placeholder={t(EntityPlaceholdersI18nKey.Title)}
        value={runner.title}
        optional={true}
        onChange={(title?: string) => {
          onChangeRunner({ ...runner, title });
        }}
      />

      <div className="lg:w-[35%] flex flex-col gap-y-8">
        <DialSelectField
          value={runner.type || BasicI18nKey.None}
          elementId="type"
          options={types}
          fieldTitle={t(EntityFieldsI18nKey.type)}
          placeholder={t(EntityPlaceholdersI18nKey.Type)}
          onChange={(type) => {
            onChangeRunner({ ...runner, type: type === BasicI18nKey.None ? void 0 : (type as TypeEntity) });
          }}
        />

        <DialSelectField
          value={runner['dial:applicationTypeBucketCopy'] || TypeBucketCopy.DISABLED}
          elementId="typeCopy"
          options={typeBucketCopy}
          fieldTitle={t(EntityFieldsI18nKey['dial:applicationTypeBucketCopy'])}
          placeholder={t(EntityPlaceholdersI18nKey.TypeBucketCopy)}
          onChange={(type) => onChangeTypeCopyBucket(type as string)}
        />
      </div>
      <TopicsControl entity={runner} onChange={onChangeRunner} />

      <CompletionEndpointControl
        endpoint={runner['dial:applicationTypeCompletionEndpoint']}
        onChange={onChangeCompletionEndPoint}
        required={true}
      />

      <ViewerUrlControl endpoint={runner['dial:applicationTypeViewerUrl']} onChange={onChangeViewerUrl} />
      <EditorUrlControl endpoint={runner['dial:applicationTypeEditorUrl']} onChange={onChangeEditorUrl} />
    </div>
  );
};

export default AppRunnerExtendedProperties;
