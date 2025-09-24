import { useCallback, useEffect, useRef, useState } from 'react';

import { PopUpState } from '@/src/types/pop-up';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ServerActionResponse } from '@/src/models/server-action';
import { CreateI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectAdapterModal from '@/src/components/SourceField/Adapters/SelectAdapterModal';
import Button from '@/src/components/Common/Button/Button';
import Field from '@/src/components/Common/Field/Field';
import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { getEndpointPostfix } from '@/src/components/ModelView/ModelProperties/utils';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getAdapters: () => Promise<ServerActionResponse | null>;
  isModal?: boolean;
}

const Adapters = <T extends DialModel | DialInterceptor>({ entity, onChange, getAdapters, isModal }: Props<T>) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [adapters, setAdapters] = useState<DialAdapter[]>([]);
  const [selectedAdapter, setSelectedAdapter] = useState<DialAdapter | null>(null);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

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
      const res = await getModelsAdapters();
      if (res.success) {
        setAdapters((res.response as DialAdapter[]) || []);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    };

    fetchRunners().catch((error) => showNotification(getErrorNotification(error.errorHeader, error.errorMessage)));
  }, [getAdapters, showNotification]);

  useEffect(() => {
    setSelectedAdapter(adapters?.find((adapter) => adapter.name === entity.source?.adapterName) || null);
  }, [entity, adapters]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex lg:flex-row flex-col gap-2 items-end">
        {isModal ? (
          <div className="flex flex-col w-full">
            <DropdownField
              items={adapters.map((adapter) => ({
                id: adapter.name as string,
                name: adapter.displayName || adapter.name || '',
              }))}
              onChange={onSelect}
              elementId={'source-type'}
              selectedValue={adapters.find((adapter) => adapter.name === entity.source?.adapterName)?.name}
              placeholder={t(CreateI18nKey.SelectAdapter)}
              fieldTitle={t(EntityFieldsI18nKey.adapter)}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:w-[35%]">
            <Field fieldTitle={t(SourceI18nKey.Adapter)} htmlFor={'adapters'} />
            <InputModal
              modalState={modalState}
              onOpenModal={onOpenModal}
              selectedValue={selectedAdapter?.name}
              elementId={'adapters'}
            >
              <SelectAdapterModal
                selected={entity.source?.adapterName}
                onClose={onCloseModal}
                onApply={onSelect}
                adapters={adapters}
                modalState={modalState}
              />
            </InputModal>
          </div>
        )}
        {entity.source?.adapterName && !isModal && (
          <Button
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            cssClass="secondary"
            title={t(SourceI18nKey.OpenAdapter)}
            onClick={() => openAdapter()}
          />
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
