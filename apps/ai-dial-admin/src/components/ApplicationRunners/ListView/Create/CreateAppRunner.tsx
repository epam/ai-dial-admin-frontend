import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { createApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/AppRunnerProperties';
import { getErrorForAppRunnerId } from '@/src/components/ApplicationRunners/ConfigurationView/AppRunnerProperties.utils';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  route: ApplicationRoute;
}

const CreateScheme: FC<Props> = ({ modalState, onClose, route }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const { showNotification } = useNotification();

  const [currentScheme, setScheme] = useState<DialApplicationScheme>({
    'dial:applicationTypeDisplayName': '',
    $schema: 'https://dial.epam.com/application_type_schemas/schema#',
    $id: '',
  });
  const [isValid, setIsValid] = useState(false);

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

  useEffect(() => {
    const isValidId =
      !!currentScheme.$id &&
      !getErrorForAppRunnerId(currentScheme.$id, t) &&
      !getErrorForDescription(currentScheme?.description, t);
    setIsValid(isValidId && !!currentScheme['dial:applicationTypeDisplayName']);
  }, [currentScheme, t]);

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.ApplicationRunner)} portalId="CreateRunner" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <SchemeProperties entity={currentScheme} onChangeScheme={onChangeScheme} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Create)} onClick={onCreate} disable={!isValid} />
      </div>
    </Popup>
  );
};

export default CreateScheme;
