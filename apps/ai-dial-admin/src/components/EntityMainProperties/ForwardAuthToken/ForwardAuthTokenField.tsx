import { FC, useCallback, useState } from 'react';

import {
  AlertVariant,
  DialAlert,
  DialRadioGroupPopupField,
  DialInput,
  PopupSize,
  RadioButtonWithContent,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import {
  BasicI18nKey,
  CreateI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ForwardTokenI18nKey,
} from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getAlertTitlePerView, getDisplayNamePerView, NONE_ID, USE_ID } from './utils';

interface Props {
  view: ApplicationRoute;
  entity: ChatEntity;
  onChangeEntity: (entity: ChatEntity) => void;
  disabled?: boolean;
}

const ForwardAuthTokenField: FC<Props> = ({ view, entity, onChangeEntity, disabled }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;
  const t = useI18n();
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
      setIsValid(name === entity.displayName);
    },
    [entity.displayName],
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
          <DialInput
            id="entityName"
            labelProps={{ label: displayNameKey ? t(displayNameKey as CreateI18nKey) : '' }}
            placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
            value={confirmName}
            onChange={onChangeName}
            disabled={isReadonly}
          />
        </div>
      ),
    },
  ];

  return (
    <div className={classNames('flex flex-col', STANDARD_CONTROL_WIDTH)}>
      <DialRadioGroupPopupField
        htmlFor="forwardAuthToken"
        id="forwardAuthToken"
        emptyValueText={t(BasicI18nKey.None)}
        label={t(EntityFieldsI18nKey.forwardAuthToken)}
        header={t(ForwardTokenI18nKey.ForwardTokenModalTitle)}
        portalId="entityNameToken"
        size={PopupSize.Sm}
        selectedRadioValue={forwardToken ? radioButtons[1].id : radioButtons[0].id}
        selectedValue={forwardToken ? radioButtons[1].id : radioButtons[0].id}
        isValid={isValid}
        radioButtons={radioButtons}
        onChangeRadioField={onChangeRadioField}
        onApply={onApply}
        disabled={isReadonly}
      />
    </div>
  );
};

export default ForwardAuthTokenField;
