import { DialInputPopup, DialLabel, DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import ComplexInput from '@/src/components/Common/ComplexInput/ComplexInput';
import SelectAdapterModal from '@/src/components/SourceField/Adapters/SelectAdapterModal';
import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import {
  ButtonsI18nKey,
  CreateI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  SourceI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getAdapters: () => Promise<ServerActionResponse | null>;
  error?: string;
  isModal?: boolean;
  disabled?: boolean;
}

const Adapters = <T extends DialModel | DialInterceptor>({
  entity,
  onChange,
  getAdapters,
  error,
  isModal,
  disabled,
}: Props<T>) => {
  const t = useI18n();
  const showNotificationRef = useRef(useNotification().showNotification);
  const getReqRef = useRef(useProtectedRequest());

  const isMobile = useIsMobileScreen();
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
            entity.source?.completionEndpointPath || `${entity.name}${getEndpointPostfix((entity as DialModel).type)}`,
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
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
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
      <div className="flex lg:flex-row flex-col gap-2">
        {isModal ? (
          <div className="w-full">
            <DialSelectField
              searchable={true}
              options={adapters.map((adapter) => ({
                value: adapter.name as string,
                label: adapter.displayName || adapter.name || '',
              }))}
              onChange={(adapter) => onSelect(adapter as string)}
              id="source-type"
              required
              value={adapters.find((adapter) => adapter.name === entity.source?.adapterName)?.name}
              placeholder={t(CreateI18nKey.SelectAdapter)}
              label={t(EntityFieldsI18nKey.adapter)}
              disabled={disabled}
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-2')}>
              <DialLabel label={t(SourceI18nKey.Adapter)} required htmlFor="adapters" />
              <DialInputPopup
                open={isModalOpen}
                onOpen={onOpenModal}
                selectedValue={selectedAdapter?.displayName || selectedAdapter?.name || ''}
                elementId="adapters"
                errorText={error}
                emptyValueText={t(EntitiesI18nKey.NoAdapters)}
                disabled={disabled}
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
            {entity.source?.adapterName && !disabled && (
              <DialNeutralButton
                iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                className={classNames(error ? 'self-center mt-[3px]' : 'self-end', 'shrink-0')}
                label={isMobile ? '' : t(ButtonsI18nKey.Open)}
                onClick={() => openAdapter()}
              />
            )}
          </div>
        )}
      </div>
      {entity.source?.adapterName && selectedAdapter && selectedAdapter.baseEndpoint && !isModal && (
        <ModelEndpoint
          entity={entity}
          prefix={selectedAdapter?.baseEndpoint}
          onChange={onChange as (entity: DialModel) => void}
          disabled={disabled}
          hideResponsesEndpoint
        />
      )}
      {entity.source?.adapterName && selectedAdapter && selectedAdapter.responsesEndpoint && (
        <ComplexInput
          copyable
          id="responsesEndpoint"
          label={t(EntityFieldsI18nKey.responsesEndpoint)}
          value={selectedAdapter.responsesEndpoint || ''}
        />
      )}
    </div>
  );
};

export default Adapters;
