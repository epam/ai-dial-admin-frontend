import { FC, useCallback, useState } from 'react';
import {
  AlertVariant,
  DialAlert,
  DialRadioGroupPopupField,
  PopupSize,
  RadioButtonWithContent,
  DialTextInputField,
} from '@epam/ai-dial-ui-kit';

import {
  BasicI18nKey,
  CreateI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ForwardTokenI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getAlertTitlePerView, getDisplayNamePerView, NONE_ID, USE_ID } from './utils';

interface Props {
  view: ApplicationRoute;
  entity: ChatEntity;
  onChangeEntity: (entity: ChatEntity) => void;
}

const ForwardAuthTokenField: FC<Props> = ({ view, entity, onChangeEntity }) => {
  const t = useI18n() as (t: string) => string;
  const titleKey = getAlertTitlePerView(view);
  const displayNameKey = getDisplayNamePerView(view);
  const [isValid, setIsValid] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [forwardToken, setForwardToken] = useState(entity.forwardAuthToken);

  const onSetForwardToken = useCallback(
    (forwardAuthToken: boolean) => {
      setForwardToken(forwardAuthToken);
      onChangeEntity({ ...entity, forwardAuthToken });
    },
    [onChangeEntity, entity],
  );

  const onChangeRadioField = useCallback(
    (id: string) => {
      const isForwardToken = id === USE_ID;
      setForwardToken(isForwardToken);
      setIsValid(!isForwardToken || confirmName.trim() === entity.displayName);
    },
    [entity.displayName, confirmName],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      setConfirmName(name || '');
      setIsValid(name === (view === ApplicationRoute.Interceptors ? entity.name : entity.displayName));
    },
    [entity.displayName, entity.name, view],
  );

  const onApply = useCallback(() => {
    onSetForwardToken(Boolean(forwardToken));
  }, [onSetForwardToken, forwardToken]);

  const radioButtons: RadioButtonWithContent[] = [
    { id: NONE_ID, name: t(BasicI18nKey.None) },
    {
      id: USE_ID,
      name: titleKey ? t(titleKey as ForwardTokenI18nKey) : '',
      content: (
        <div className="flex flex-col gap-y-8 mt-3">
          <DialAlert variant={AlertVariant.Error} message={t(ForwardTokenI18nKey.ForwardTokenModalAlert)} />
          <DialTextInputField
            elementId="entityName"
            fieldTitle={displayNameKey !== '' ? t(displayNameKey as CreateI18nKey) : ''}
            placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
            value={confirmName}
            onChange={onChangeName}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <DialRadioGroupPopupField
        htmlFor="forwardAuthToken"
        id="forwardAuthToken"
        emptyValueText={t(BasicI18nKey.None)}
        fieldTitle={t(EntityFieldsI18nKey.forwardAuthToken)}
        title={t(ForwardTokenI18nKey.ForwardTokenModalTitle)}
        portalId="entityNameToken"
        size={PopupSize.Sm}
        selectedRadioValue={forwardToken ? radioButtons[1].id : radioButtons[0].id}
        selectedValue={forwardToken ? radioButtons[1].id : radioButtons[0].id}
        isValid={isValid}
        radioButtons={radioButtons}
        onChangeRadioField={onChangeRadioField}
        onApply={onApply}
      />
    </div>
  );
};

export default ForwardAuthTokenField;
