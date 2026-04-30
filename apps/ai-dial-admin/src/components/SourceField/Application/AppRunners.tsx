'use client';

import { DialInputPopup, DialLabel, DialNeutralButton, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import { JSONSchema7 } from 'json-schema';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { createSchemaSource, getSchemaSourceId } from '@/src/utils/entities/application-source';
import { getSchemaDefaults } from '@/src/utils/schema';
import SelectAppRunnerModal from './SelectAppRunnersModal';

interface Props {
  /** Entity-based API: AppRunners owns scheme-fetch + applicationProperties derivation side-effect. */
  entity?: DialApplication;
  onChange?: (entity: DialApplication) => void;
  /** Legacy callback-based API: used by AssetApp flow in ApplicationSource.tsx, where the write pattern differs. */
  selectedValue?: string;
  onChangeValue?: (value?: string) => void;
  runners?: DialApplicationScheme[];
  label?: string;
  isEntityImmutable?: boolean;
  isModal?: boolean;
  disabled?: boolean;
}

const AppRunners: FC<Props> = ({
  entity,
  onChange,
  selectedValue,
  onChangeValue,
  runners,
  label,
  isEntityImmutable = false,
  disabled,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const currentLocale = useCurrentLocale();
  const { dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valueTitle, setValueTitle] = useState('');
  const isMobile = useIsMobileScreen();

  const currentValue = entity ? getSchemaSourceId(entity.source) : selectedValue;
  const isFieldDisabled = disabled || isReadOnlyAdmin;

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'sourceEntitySelector', isValid: !!currentValue });
    return () => dispatch({ type: ValidationActionType.SetField, field: 'sourceEntitySelector', isValid: true });
  }, [currentValue, t, dispatch]);

  const dropdownItems = useMemo(() => {
    return (
      runners?.map((r) => ({
        value: r.$id || '',
        label: r['dial:applicationTypeDisplayName'] || '',
      })) || ([] as SelectOption[])
    );
  }, [runners]);

  const handleRunnerSelect = useCallback(
    (value?: string) => {
      onCloseModal();

      if (entity && onChange) {
        const baseEntity: DialApplication = {
          ...entity,
          source: value ? createSchemaSource(value) : undefined,
          endpoint: undefined,
          mcp: undefined,
        };

        const runner = runners?.find((r) => r.$id === value);
        if (!runner) {
          onChange(baseEntity);
          return;
        }

        getResolvedApplicationScheme(runner.$id ?? '').then((res) => {
          const scheme: DialApplicationScheme =
            res.success && (res.response as { schema?: DialApplicationScheme })?.schema
              ? (res.response as { schema: DialApplicationScheme }).schema
              : runner;
          const applicationProperties = getSchemaDefaults(scheme as JSONSchema7) as Record<string, unknown>;
          onChange({
            ...baseEntity,
            applicationProperties: isEntityImmutable ? { ...baseEntity.applicationProperties } : applicationProperties,
          });
        });

        return;
      }

      if (onChangeValue) {
        onChangeValue(value);
      }
    },
    [entity, onChange, isEntityImmutable, onChangeValue, onCloseModal, runners],
  );

  const openInNewTab = useCallback(() => {
    window.open(
      `/${currentLocale}${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(`${currentValue}`)}`,
      '_blank',
    );
  }, [currentLocale, currentValue]);

  useEffect(() => {
    setValueTitle(dropdownItems?.find((r) => r.value === currentValue)?.label || '');
  }, [currentValue, dropdownItems]);

  return !isEntityImmutable ? (
    <DialSelectField
      value={currentValue}
      searchable={true}
      required
      id="sourceEntity"
      className="w-full mt-1"
      disabled={isFieldDisabled}
      options={dropdownItems}
      label={label}
      placeholder={t(EntityPlaceholdersI18nKey.SelectAppRunner)}
      onChange={(runner) => handleRunnerSelect(runner as string)}
    />
  ) : (
    <div className="flex mt-1">
      <div className="flex gap-2 items-end">
        <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-2')}>
          <DialLabel label={label} required htmlFor="sourceEntity" />
          <DialInputPopup
            disabled={isFieldDisabled}
            placeholder={t(EntityPlaceholdersI18nKey.SelectAppRunner)}
            open={isModalOpen}
            onOpen={onOpenModal}
            selectedValue={valueTitle}
          >
            <SelectAppRunnerModal
              selectedId={currentValue}
              onApply={handleRunnerSelect}
              isModalOpen={isModalOpen}
              onClose={onCloseModal}
              sourceEntities={runners}
            />
          </DialInputPopup>
        </div>
        {currentValue && (
          <DialNeutralButton
            label={isMobile ? '' : t(ButtonsI18nKey.Open)}
            iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
            onClick={openInNewTab}
          />
        )}
      </div>
    </div>
  );
};

export default AppRunners;
