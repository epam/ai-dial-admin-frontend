import { FC, useCallback, useEffect, useState } from 'react';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { PopUpState } from '@/src/types/pop-up';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { SourceI18nKey } from '@/src/constants/i18n';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectRunnerModal from '@/src/components/SourceField/Template/SelectRunnerModal';
import Button from '@/src/components/Common/Button/Button';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
  getRunners: () => Promise<InterceptorTemplate[] | null>;
}

const Templates: FC<Props> = ({ entity, onChange, getRunners }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [runners, setRunners] = useState<InterceptorTemplate[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<InterceptorTemplate | null>(null);

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
        configurationEndpoint: '',
        source: {
          ...entity.source,
          $type: entity.source?.$type || SOURCE_TYPE.RUNNER,
          runnerName: name,
        },
      });
      onCloseModal();
    },
    [entity, onChange, onCloseModal],
  );

  const openTemplate = useCallback(() => {
    window.open(
      `${ApplicationRoute.InterceptorTemplates}/${getEntityPath(ApplicationRoute.InterceptorTemplates, selectedRunner)}`,
      '_blank',
    );
  }, [selectedRunner]);

  useEffect(() => {
    const fetchRunners = async () => {
      const runners = await getRunners();
      if (runners?.length) {
        setRunners(runners);
      }
    };

    fetchRunners().catch((error) => showNotification(getErrorNotification(error.errorHeader, error.errorMessage)));
  }, [getRunners, showNotification]);

  useEffect(() => {
    setSelectedRunner(runners?.find((runner) => runner.name === entity.source?.runnerName) || null);
  }, [entity, runners]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex lg:flex-row flex-col gap-2">
        <div className="lg:w-[35%]">
          <InputModal modalState={modalState} onOpenModal={onOpenModal} selectedValue={selectedRunner?.name}>
            <SelectRunnerModal
              selected={entity.source?.runnerName}
              onClose={onCloseModal}
              onApply={onSelect}
              runners={runners}
              modalState={modalState}
            />
          </InputModal>
        </div>
        {entity.source?.runnerName && (
          <Button
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            cssClass="secondary"
            title={t(SourceI18nKey.OpenTemplate)}
            onClick={() => openTemplate()}
          />
        )}
      </div>
    </div>
  );
};

export default Templates;
