import { useCallback, useEffect, useState } from 'react';

import {
  DialInput,
  Notification,
  NotificationType,
  NotificationVariant,
  PopupSize,
  RadioGroupItem,
  RadioGroupPopupField,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import {
  BasicI18nKey,
  CreateI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ForwardTokenI18nKey,
} from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { LocalizedText } from '@/src/models/dial/localized';
import { ApplicationRoute } from '@/src/types/routes';
import { resolveLocalizedText } from '@/src/utils/entities/localized-value';
import { getAlertTitlePerView, getDisplayNamePerView, NONE_ID, USE_ID } from './utils';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  onChangeEntity: (entity: T) => void;
  disabled?: boolean;
}

const ForwardAuthTokenField = <T extends { displayName?: LocalizedText; forwardAuthToken?: boolean }>({
  view,
  entity,
  onChangeEntity,
  disabled,
}: Props<T>) => {
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
      setIsValid(!isForwardToken || confirmName.trim() === resolveLocalizedText(entity.displayName));
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

  const selectedId = forwardToken ? USE_ID : NONE_ID;

  const items: RadioGroupItem[] = [
    { value: NONE_ID, label: t(BasicI18nKey.None) },
    {
      value: USE_ID,
      label: titleKey ? t(titleKey as ForwardTokenI18nKey) : '',
      content: (
        <div className="flex flex-col gap-y-8 mt-3">
          <Notification
            type={NotificationType.SectionMessage}
            variant={NotificationVariant.Error}
            message={t(ForwardTokenI18nKey.ForwardTokenModalAlert)}
          />
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

  useEffect(() => {
    setForwardToken(entity.forwardAuthToken);
  }, [entity.forwardAuthToken]);

  return (
    <div className={classNames('flex flex-col', STANDARD_CONTROL_WIDTH)}>
      <RadioGroupPopupField
        id="forwardAuthToken"
        labelProps={{ label: t(EntityFieldsI18nKey.forwardAuthToken) }}
        header={t(ForwardTokenI18nKey.ForwardTokenModalTitle)}
        portalId="entityNameToken"
        size={PopupSize.Sm}
        value={selectedId}
        selectedValue={selectedId}
        isValid={isValid}
        items={items}
        onSelectionChange={onChangeRadioField}
        onApply={onApply}
        onCancel={() => {
          setForwardToken(entity.forwardAuthToken);
          setConfirmName('');
          setIsValid(false);
        }}
        disabled={isReadonly}
      />
    </div>
  );
};

export default ForwardAuthTokenField;
