import { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonVariant, DialButton, DialInputPopup, DialSelectField } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { IconExternalLink } from '@tabler/icons-react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ServerActionResponse } from '@/src/models/server-action';
import { CreateI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { useI18n } from '@/src/locales/client';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

import SelectAdapterModal from '@/src/components/SourceField/Adapters/SelectAdapterModal';
import Field from '@/src/components/Common/Field/Field';
import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getAdapters: () => Promise<ServerActionResponse | null>;
  errorText?: string;
  isModal?: boolean;
}

const Adapters = <T extends DialModel | DialInterceptor>({
  entity,
  onChange,
  getAdapters,
  errorText,
  isModal,
}: Props<T>) => {
  const t = useI18n();
  const showNotificationRef = useRef(useNotification().showNotification);
  const getReqRef = useRef(useProtectedRequest());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adapters, setAdapters] = useState<DialAdapter[]>([]);
  const [selectedAdapter, setSelectedAdapter] = useState<DialAdapter | null>(null);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onSelect = useCallback(
    (name?: string) => {
      onChange({
        ...entity,
        endpoint: '',
        source: {
          ...entity.source,
          $type: entity.source?.$type || SOURCE_TYPE.ADAPTER,
          adapterName: name,
          completionEndpointPath:
            entity.source?.completionEndpointPath || getEndpointPostfix((entity as DialModel).type),
        },
      });
      onCloseModal();
    },
    [entity, onChange, onCloseModal],
  );

  const openAdapter = useCallback(() => {
    onOpenInNewTab(ApplicationRoute.Adapters, selectedAdapter);
  }, [selectedAdapter]);

  useEffect(() => {
    const fetchRunners = async () => {
      getReqRef.current(getModelsAdapters).then((res) => {
        if (res.success) {
          setAdapters(res.response || []);
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    };

    fetchRunners();
  }, [getAdapters]);

  useEffect(() => {
    setSelectedAdapter(adapters?.find((adapter) => adapter.name === entity.source?.adapterName) || null);
  }, [entity, adapters]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex lg:flex-row flex-col gap-2 items-end">
        {isModal ? (
          <div className="w-full">
            <DialSelectField
              searchable={true}
              options={adapters.map((adapter) => ({
                value: adapter.name as string,
                label: adapter.displayName || adapter.name || '',
              }))}
              onChange={(adapter) => onSelect(adapter as string)}
              elementId={'source-type'}
              value={adapters.find((adapter) => adapter.name === entity.source?.adapterName)?.name}
              placeholder={t(CreateI18nKey.SelectAdapter)}
              fieldTitle={t(EntityFieldsI18nKey.adapter)}
            />
          </div>
        ) : (
          <div className="flex w-full gap-2">
            <div className="w-full lg:w-[45%]">
              <Field fieldTitle={t(SourceI18nKey.Adapter)} htmlFor={'adapters'} />
              <DialInputPopup
                open={isModalOpen}
                onOpen={onOpenModal}
                selectedValue={selectedAdapter?.displayName || selectedAdapter?.name || ''}
                elementId={'adapters'}
                errorText={errorText}
                emptyValueText={t(EntitiesI18nKey.NoAdapters)}
              >
                <SelectAdapterModal
                  selected={entity.source?.adapterName}
                  onClose={onCloseModal}
                  onApply={onSelect}
                  adapters={adapters}
                  isModalOpen={isModalOpen}
                />
              </DialInputPopup>
            </div>
            {entity.source?.adapterName && (
              <DialButton
                iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
                variant={ButtonVariant.Secondary}
                className={classNames(errorText ? 'self-center mt-[3px]' : 'self-end', 'shrink-0')}
                label={t(SourceI18nKey.OpenAdapter)}
                onClick={() => openAdapter()}
              />
            )}
          </div>
        )}
      </div>
      {entity.source?.adapterName && selectedAdapter && !isModal && (
        <ModelEndpoint
          entity={entity}
          prefix={selectedAdapter?.baseEndpoint}
          onChange={onChange as (entity: DialModel) => void}
        />
      )}
    </div>
  );
};

export default Adapters;
