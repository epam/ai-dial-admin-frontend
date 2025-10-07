import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { createApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  route: ApplicationRoute;
}

const CreateAppRunner: FC<Props> = ({ modalState, onClose, route }) => {
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
        router.push(`${originalRoute}/${getEntityPath(ApplicationRoute.ApplicationRunners, currentScheme)}`);
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentScheme, route, router, onClose, showNotification]);

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
    <Popup onClose={onClose} heading={t(CreateI18nKey.ApplicationRunner)} portalId="CreateRunner" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <SchemeProperties runner={currentScheme} onChangeRunner={onChangeScheme} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Create)}
          onClick={onCreate}
          disable={!isValid}
        />
      </div>
    </Popup>
  );
};

export default CreateAppRunner;
