import { FC, useCallback, useMemo, useState } from 'react';

import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import SourceEntitySelector from '@/src/components/EntityMainProperties/SourceEntitySelector/SourceEntitySelector';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';
import { SourceTypes } from './constants';

interface Props {
  entity: DialApplication;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: DialApplication) => void;
}

const ApplicationSource: FC<Props> = ({ entity, runners, onChangeEntity, isEntityImmutable }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const sources: DropdownItemsModel[] = useMemo(
    () => [
      {
        id: SourceTypes.ENDPOINTS,
        name: t(EntitiesI18nKey.Endpoints),
      },
      {
        id: SourceTypes.APP_RUNNER,
        name: t(EntitiesI18nKey.AppRunner),
      },
    ],
    [t],
  );
  const [sourceType, setSourceType] = useState<DropdownItemsModel | undefined>(
    entity.endpoint || !entity.customAppSchemaId ? sources[0] : sources[1],
  );
  const [endpointErrorText, setEndpointErrorText] = useState('');

  const onChangeSource = useCallback(
    (value: string) => {
      if (sourceType?.id !== value) {
        setEndpointErrorText('');
        setSourceType(sources?.find((t) => t.id === value));
        onChangeEntity({
          ...entity,
          endpoint: void 0,
          viewerUrl: void 0,
          editorUrl: void 0,
          customAppSchemaId: void 0,
        });
      }
    },
    [entity, onChangeEntity, sourceType?.id, sources],
  );

  const onChangeEndpoint = useCallback(
    (endpoint: string) => {
      onChangeEntity({ ...entity, endpoint });
      setEndpointErrorText(endpoint ? '' : t(ErrorI18nKey.RequiredField));
    },
    [entity, onChangeEntity, t],
  );

  const onChangeAppRunner = useCallback(
    (value?: string) => {
      onChangeEntity({ ...entity, customAppSchemaId: value, endpoint: void 0 });
    },
    [entity, onChangeEntity],
  );

  const openInNewTab = useCallback(() => {
    window.open(
      `/${currentLocale}${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(`${entity.customAppSchemaId}`)}`,
      '_blank',
    );
  }, [currentLocale, entity.customAppSchemaId]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="max-w-[180px]">
        <DropdownField
          selectedValue={sourceType?.id}
          elementId="sourceType"
          items={sources}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          onChange={onChangeSource}
        />
      </div>
      {sourceType?.id === SourceTypes.ENDPOINTS && (
        <div className={classNames('flex flex-col gap-4', isEntityImmutable ? 'lg:w-[35%]' : 'w-full')}>
          <TextInputField
            elementId="completionEndpoint"
            fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
            placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
            value={entity.endpoint}
            onChange={onChangeEndpoint}
            invalid={!!endpointErrorText}
            errorText={endpointErrorText}
          />
          {isEntityImmutable && (
            <>
              <TextInputField
                optional={true}
                elementId="viewerUrl"
                fieldTitle={t(CreateI18nKey.ViewerUrlTitle)}
                placeholder={t(CreateI18nKey.ViewerUrlPlaceholder)}
                value={entity.viewerUrl}
                onChange={(viewerUrl) => onChangeEntity({ ...entity, viewerUrl })}
              />
              <TextInputField
                optional={true}
                elementId="editorUrl"
                fieldTitle={t(CreateI18nKey.EditorUrlTitle)}
                placeholder={t(CreateI18nKey.EditorUrlPlaceholder)}
                value={entity.editorUrl}
                onChange={(editorUrl) => onChangeEntity({ ...entity, editorUrl })}
              />
            </>
          )}
        </div>
      )}
      {sourceType?.id === SourceTypes.APP_RUNNER && (
        <div className="flex flex-row gap-4 items-start">
          <div className={classNames(isEntityImmutable ? 'lg:w-[35%]' : 'w-full')}>
            <SourceEntitySelector
              fieldTitle={t(CreateI18nKey.RunnerName)}
              placeholder={t(CreateI18nKey.RunnerPlaceholder)}
              selectedValue={entity.customAppSchemaId}
              sourceEntities={runners}
              isEntityImmutable={isEntityImmutable}
              onChangeValue={onChangeAppRunner}
            />
          </div>
          {isEntityImmutable && entity.customAppSchemaId && (
            <Button
              cssClass="secondary mt-[22px]"
              title={t(ButtonsI18nKey.OpenAppRunner)}
              iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
              onClick={openInNewTab}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationSource;
