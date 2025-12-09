'use client';

import { ButtonVariant, DialButton, DialInputPopup, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import Field from '@/src/components/Common/Field/Field';
import { ButtonsI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import SelectAppRunnerModal from './SelectAppRunnersModal';

interface Props {
  selectedValue?: string;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeValue: (value?: string) => void;
}

const AppRunners: FC<Props> = ({ selectedValue, runners, onChangeValue, isEntityImmutable = false }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const { dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valueTitle, setValueTitle] = useState('');

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'sourceEntitySelector', isValid: !!selectedValue });
    return () => dispatch({ type: ValidationActionType.SetField, field: 'sourceEntitySelector', isValid: true });
  }, [selectedValue, t, dispatch]);

  const dropdownItems = useMemo(() => {
    return (
      runners?.map((entity) => ({
        value: (entity as DialApplicationScheme).$id || '',
        label: (entity as DialApplicationScheme)['dial:applicationTypeDisplayName'] || '',
      })) || ([] as SelectOption[])
    );
  }, [runners]);

  const onChange = useCallback(
    (value?: string) => {
      onChangeValue(value);

      onCloseModal();
    },
    [onChangeValue, onCloseModal],
  );

  const openInNewTab = useCallback(() => {
    window.open(
      `/${currentLocale}${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(`${selectedValue}`)}`,
      '_blank',
    );
  }, [currentLocale, selectedValue]);

  useEffect(() => {
    setValueTitle(dropdownItems?.find((r) => r.value === selectedValue)?.label || '');
  }, [selectedValue, dropdownItems]);

  return !isEntityImmutable ? (
    <DialSelectField
      value={selectedValue}
      searchable={true}
      elementId="sourceEntity"
      className="w-full"
      options={dropdownItems}
      fieldTitle={t(EntitiesI18nKey.AppRunner)}
      placeholder={t(EntityPlaceholdersI18nKey.SelectAppRunner)}
      onChange={(runner) => onChange(runner as string)}
    />
  ) : (
    <div className={classNames('flex flex-row gap-2 items-end', STANDARD_CONTROL_WIDTH)}>
      <div className={CONTROL_WITH_BUTTON_WIDTH}>
        <Field fieldTitle={t(EntitiesI18nKey.AppRunner)} htmlFor="sourceEntity" />
        <DialInputPopup
          emptyValueText={t(EntitiesI18nKey.NoApplicationRunners)}
          open={isModalOpen}
          onOpen={onOpenModal}
          selectedValue={valueTitle}
        >
          <SelectAppRunnerModal
            selectedId={selectedValue}
            onApply={onChange}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            sourceEntities={runners}
          />
        </DialInputPopup>
      </div>
      {selectedValue && (
        <DialButton
          variant={ButtonVariant.Secondary}
          label={t(ButtonsI18nKey.OpenAppRunner)}
          iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
          onClick={openInNewTab}
        />
      )}
    </div>
  );
};

export default AppRunners;
