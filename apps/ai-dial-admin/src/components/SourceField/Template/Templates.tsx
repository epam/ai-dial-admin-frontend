import { useCallback, useEffect, useRef, useState } from 'react';

import { DialInputPopup, DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import Field from '@/src/components/Common/Field/Field';
import SelectRunnerModal from '@/src/components/SourceField/Template/SelectRunnerModal';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { CreateI18nKey, EntitiesI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getRunners: () => Promise<ServerActionResponse<InterceptorTemplate[]>>;
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
  const getReqRef = useRef(useProtectedRequest());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runners, setRunners] = useState<InterceptorTemplate[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<InterceptorTemplate | null>(null);

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
      const runners = (await getReqRef.current(getRunners)).response;
      if (runners?.length) {
        setRunners(runners);
      }
    };

    fetchRunners().catch((error) =>
      showNotification(getErrorNotification(error.errorHeader, error.errorMessage, error.requestId)),
    );
  }, [getRunners, showNotification]);

  useEffect(() => {
    setSelectedRunner(runners?.find((runner) => runner.name === entity.source?.runnerName) || null);
  }, [entity, runners]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex lg:flex-row flex-col gap-2 items-end">
        {isModal ? (
          <div className="flex flex-col w-full">
            <DialSelectField
              options={runners.map((runner) => ({
                value: runner.name as string,
                label: runner.displayName || runner.name || '',
              }))}
              searchable={true}
              onChange={(value) => onSelect(value as string)}
              id="source-type"
              value={runners.find((runner) => runner.name === entity.source?.runnerName)?.name}
              placeholder={t(CreateI18nKey.SelectInterceptorTemplate)}
              label={t(SourceI18nKey.InterceptorTemplate)}
            />
          </div>
        ) : (
          <div className={classNames('flex gap-2', STANDARD_CONTROL_WIDTH)}>
            <div className={CONTROL_WITH_BUTTON_WIDTH}>
              <Field fieldTitle={t(SourceI18nKey.InterceptorTemplate)} htmlFor="templates" />
              <DialInputPopup
                open={isModalOpen}
                onOpen={onOpenModal}
                selectedValue={selectedRunner?.name}
                elementId="templates"
                errorText={errorText}
                emptyValueText={t(EntitiesI18nKey.NoTemplates)}
              >
                <SelectRunnerModal
                  selected={entity.source?.runnerName}
                  onClose={onCloseModal}
                  onApply={onSelect}
                  runners={runners}
                  isModalOpen={isModalOpen}
                />
              </DialInputPopup>
            </div>
            {entity.source?.runnerName && (
              <DialNeutralButton
                iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                className={classNames(errorText ? 'self-center mt-[3px]' : 'self-end', 'shrink-0')}
                label={t(SourceI18nKey.OpenTemplate)}
                onClick={() => openTemplate()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
