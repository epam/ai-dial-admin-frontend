import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import { createApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  route: ApplicationRoute;
}

const CreateAppRunner: FC<Props> = ({ isModalOpen, onClose, route }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const { showNotification } = useNotification();

  const [currentScheme, setScheme] = useState<DialApplicationScheme>({
    'dial:applicationTypeDisplayName': '',
    $schema: 'https://dial.epam.com/application_type_schemas/schema#',
    $id: '',
  });
  const { isValid, dispatch } = useSaveValidationContext();

  const onChangeScheme = useCallback(
    (entity: DialApplicationScheme) => {
      setScheme({ ...currentScheme, ...entity });
    },
    [currentScheme, setScheme],
  );

  const onCreate = useCallback(() => {
    createApplicationScheme(currentScheme).then((res) => {
      if (res.success) {
        const originalRoute = route.split('/')[1];
        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(ApplicationRoute.ApplicationRunners, t),
            getCreateNotificationDescription(ApplicationRoute.ApplicationRunners, currentScheme.$id, t),
          ),
        );
        router.push(`${originalRoute}/${getEntityPath(ApplicationRoute.ApplicationRunners, currentScheme)}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentScheme, route, showNotification, t, router, onClose]);

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentScheme.$id });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'displayName',
      isValid: !!currentScheme['dial:applicationTypeDisplayName'],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialPopup
      onClose={onClose}
      title={t(CreateI18nKey.ApplicationRunner)}
      portalId="CreateRunner"
      open={isModalOpen}
      footer={
        <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Create)}
            onClick={onCreate}
            disable={!isValid}
          />
        </div>
      }
    >
      <div className="flex flex-col px-6 py-4">
        <SchemeProperties runner={currentScheme} onChangeRunner={onChangeScheme} />
      </div>
    </DialPopup>
  );
};

export default CreateAppRunner;
