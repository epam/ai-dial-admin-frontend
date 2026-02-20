import { FC, useCallback } from 'react';

import { DialSelectField, DialTextInputField, SelectOption } from '@epam/ai-dial-ui-kit';

import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';
import EditorUrlControl from '@/src/components/BaseControls/Endpoint/EditorUrl';
import ViewerUrlControl from '@/src/components/BaseControls/Endpoint/ViewerUrl';
import IconControl from '@/src/components/BaseControls/Icon';
import TopicsControl from '@/src/components/BaseControls/Topics';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { DialApplicationScheme, TypeBucketCopy } from '@/src/models/dial/application';
import EndpointControl from '../../BaseControls/Endpoint/Endpoint';

interface Props {
  runner: DialApplicationScheme;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const AppRunnerExtendedProperties: FC<Props> = ({ runner, onChangeRunner }) => {
  const t = useI18n();

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
        containerClassName={STANDARD_CONTROL_WIDTH}
        onChange={(title?: string) => {
          onChangeRunner({ ...runner, title });
        }}
      />

      <DialSelectField
        value={runner['dial:applicationTypeBucketCopy'] || TypeBucketCopy.DISABLED}
        elementId="typeCopy"
        className="w-[180px]"
        childrenClassName="w-[180px]"
        containerClassName="w-[180px]"
        listClassName="w-[180px]"
        options={typeBucketCopy}
        fieldTitle={t(EntityFieldsI18nKey['dial:applicationTypeBucketCopy'])}
        placeholder={t(EntityPlaceholdersI18nKey.TypeBucketCopy)}
        onChange={(type) => onChangeTypeCopyBucket(type as string)}
      />
      <TopicsControl entity={runner} onChange={onChangeRunner} />

      <CompletionEndpointControl
        endpoint={runner['dial:applicationTypeCompletionEndpoint']}
        onChange={onChangeCompletionEndPoint}
        required={true}
      />

      <ViewerUrlControl endpoint={runner['dial:applicationTypeViewerUrl']} onChange={onChangeViewerUrl} />
      <EditorUrlControl endpoint={runner['dial:applicationTypeEditorUrl']} onChange={onChangeEditorUrl} />
      <EndpointControl
        id="applicationTypeSchemaEndpoint"
        fieldTitle={t(EntityFieldsI18nKey.applicationTypeSchemaEndpoint)}
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        endpoint={runner.applicationTypeSchemaEndpoint}
        onChange={(endpoint) => onChange(endpoint, 'applicationTypeSchemaEndpoint')}
      />
    </div>
  );
};

export default AppRunnerExtendedProperties;
