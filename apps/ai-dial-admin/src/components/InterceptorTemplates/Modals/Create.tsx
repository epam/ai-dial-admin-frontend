import { FC, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { useI18n } from '@/src/locales/client';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import { getErrorNotification } from '@/src/utils/notification';
import { createInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';

interface Props {
  route: ApplicationRoute;
  modalState: PopUpState;
  onClose: () => void;
  names: string[];
}

const Create: FC<Props> = ({ route, onClose, modalState, names }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const [template, setTemplate] = useState<InterceptorTemplate>({
    name: '',
    displayName: '',
    description: '',
  });
  const [isValid, setIsValid] = useState(false);

  const onCreate = useCallback(() => {
    createInterceptorTemplate(template).then((res) => {
      if (res.success) {
        onClose();
        router.push(`${route}/${getEntityPath(route, template)}`);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [template, route, router, onClose, showNotification]);

  useEffect(() => {
    const isValidId =
      !getErrorForName(template?.name, names, t) &&
      !!template.displayName.trim() &&
      !getErrorForDescription(template?.description, t);
    setIsValid(isValidId);
  }, [template, t, names]);

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.InterceptorTemplate)} portalId="CreateRunner" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        <BaseProperties template={template} setTemplate={setTemplate} names={names} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Create)} onClick={onCreate} disable={!isValid} />
      </div>
    </Popup>
  );
};

export default Create;
