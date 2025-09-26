import { useCallback, useEffect, useState } from 'react';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { PopUpState } from '@/src/types/pop-up';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { CreateI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { DialModel } from '@/src/models/dial/model';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectRunnerModal from '@/src/components/SourceField/Template/SelectRunnerModal';
import Button from '@/src/components/Common/Button/Button';
import Field from '@/src/components/Common/Field/Field';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import classNames from 'classnames';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getRunners: () => Promise<InterceptorTemplate[] | null>;
  errorText?: string;
  isModal?: boolean;
}

const Templates = <T extends DialModel | DialInterceptor>({
  entity,
  onChange,
  getRunners,
  errorText,
  isModal,
}: Props<T>) => {
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
    onOpenInNewTab(ApplicationRoute.InterceptorTemplates, selectedRunner);
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
        {isModal ? (
          <div className="flex flex-col w-full">
            <DropdownField
              items={runners.map((runner) => ({
                id: runner.name as string,
                name: runner.displayName || runner.name || '',
              }))}
              onChange={onSelect}
              elementId={'source-type'}
              selectedValue={runners.find((runner) => runner.name === entity.source?.runnerName)?.name}
              placeholder={t(CreateI18nKey.SelectAdapter)}
              fieldTitle={t(EntityFieldsI18nKey.adapter)}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:w-[35%]">
            <Field fieldTitle={t(SourceI18nKey.InterceptorTemplate)} htmlFor={'templates'} />
            <InputModal
              modalState={modalState}
              onOpenModal={onOpenModal}
              selectedValue={selectedRunner?.name}
              elementId={'templates'}
              errorText={errorText}
            >
              <SelectRunnerModal
                selected={entity.source?.runnerName}
                onClose={onCloseModal}
                onApply={onSelect}
                runners={runners}
                modalState={modalState}
              />
            </InputModal>
          </div>
        )}
        {entity.source?.runnerName && !isModal && (
          <Button
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            cssClass={classNames('secondary', errorText ? 'self-center mt-[3px]' : 'self-end')}
            title={t(SourceI18nKey.OpenTemplate)}
            onClick={() => openTemplate()}
          />
        )}
      </div>
    </div>
  );
};

export default Templates;
