'use client';

import {
  DialInputPopup,
  DialLabel,
  DialLoader,
  DialNeutralButton,
  DialSelectField,
  SelectOption,
} from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';
import { JSONSchema7 } from 'json-schema';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { PICKER_RUNNER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { getSchemaDefaults } from '@/src/utils/schema';
import { resolveAppRunnerScheme } from './resolve-app-runner';
import SelectAppRunnerModal from './SelectAppRunnersModal';
import { getRunnerOpenUrl } from './utils';

interface Props {
  selectedValue?: string;
  onChangeValue: (value?: string, application_properties?: Record<string, unknown>) => void;
  /** Config and Platform runners merged by `buildAppRunnerOptions`. */
  runners?: DialApplicationScheme[];
  label?: string;
  isEntityImmutable?: boolean;
  disabled?: boolean;
}

const AppRunnersResource: FC<Props> = ({
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
  const [isRunnerResolving, setIsRunnerResolving] = useState(false);
  const [runnerOptions, setRunnerOptions] = useState(runners);
  const isMobile = useIsMobileScreen();

  const currentValue = selectedValue;
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

  useEffect(() => {
    setRunnerOptions(runners);
  }, [runners]);

  // Labelled by `$id` to match the grid's `ID` column — an asset runner has no display name without a
  // per-runner content read, and a label the grid never showed would not be recognizable.
  // A stored id the list does not carry (a Platform runner whose `$id` was edited after creation) is still
  // shown, just not matched to a runner: no selected row in the picker and no Open control.
  const dropdownItems = useMemo(() => {
    const items: SelectOption[] = runnerOptions?.map((r) => ({ value: r.$id || '', label: r.$id || '' })) ?? [];

    return currentValue && !items.some((item) => item.value === currentValue)
      ? [...items, { value: currentValue, label: currentValue }]
      : items;
  }, [runnerOptions, currentValue]);

  const handleRunnerSelect = useCallback(
    async (value?: string) => {
      onCloseModal();

      const runner = runners?.find((r) => r.$id === value);

      setIsRunnerResolving(true);

      try {
        const { runner: resolvedRunner, scheme } = await resolveAppRunnerScheme(runner);

        if (runner && resolvedRunner?.$id) {
          runner.$id = resolvedRunner.$id;
          setRunnerOptions((currentRunnerOptions) => [...(currentRunnerOptions ?? [])]);
        }

        const resolvedId = resolvedRunner?.$id ?? value;
        const applicationProperties = getSchemaDefaults((scheme ?? resolvedRunner) as JSONSchema7) as Record<
          string,
          unknown
        >;

        onChangeValue(resolvedId, applicationProperties);
      } finally {
        setIsRunnerResolving(false);
      }
    },
    [onChangeValue, onCloseModal, runners],
  );

  const selectedRunner = useMemo(
    () => runnerOptions?.find((r) => r.$id === currentValue),
    [runnerOptions, currentValue],
  );
  const openUrl = selectedRunner && getRunnerOpenUrl(selectedRunner, currentLocale);

  const onOpenInNewTab = useCallback(() => {
    if (openUrl) {
      window.open(openUrl, '_blank');
    }
  }, [openUrl]);

  useEffect(() => {
    setValueTitle(dropdownItems?.find((r) => r.value === currentValue)?.label || '');
  }, [currentValue, dropdownItems]);

  return !isEntityImmutable ? (
    isRunnerResolving ? (
      <div className="relative w-full h-10">
        <DialLoader size={18} />
      </div>
    ) : (
      <DialSelectField
        value={currentValue}
        searchable={true}
        required
        id="sourceEntity"
        className="w-full mt-1"
        disabled={isFieldDisabled || isRunnerResolving}
        options={dropdownItems}
        label={label}
        placeholder={t(EntityPlaceholdersI18nKey.SelectAppRunner)}
        onChange={(runner) => handleRunnerSelect(runner as string)}
      />
    )
  ) : (
    <div className="flex mt-1">
      <div className="flex gap-2 items-end">
        <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-1')}>
          <DialLabel label={label} required htmlFor="sourceEntity" />
          <DialInputPopup
            disabled={isFieldDisabled || isRunnerResolving}
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
              sourceEntities={runnerOptions}
              columns={PICKER_RUNNER_COLUMNS(t)}
            />
          </DialInputPopup>
        </div>
        {openUrl && (
          <DialNeutralButton
            label={isMobile ? '' : t(ButtonsI18nKey.Open)}
            iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onOpenInNewTab}
          />
        )}
      </div>
    </div>
  );
};

export default AppRunnersResource;
