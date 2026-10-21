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
import { LIST_RUNNER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { createSchemaSource, getSchemaSourceId } from '@/src/utils/entities/application-source';
import { getSchemaDefaults } from '@/src/utils/schema';
import { resolveAppRunnerScheme } from './resolve-app-runner';
import SelectAppRunnerModal from './SelectAppRunnersModal';

interface Props {
  entity: DialApplication;
  onChange: (entity: DialApplication) => void;
  label?: string;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  disabled?: boolean;
}

const AppRunners: FC<Props> = ({ entity, onChange, runners, label, isEntityImmutable = false, disabled }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const currentLocale = useCurrentLocale();
  const { dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valueTitle, setValueTitle] = useState('');
  const [isRunnerResolving, setIsRunnerResolving] = useState(false);
  const isMobile = useIsMobileScreen();

  const currentValue = getSchemaSourceId(entity.source);
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
        label: r['dial:applicationTypeDisplayName'] || r.$id || '',
      })) || ([] as SelectOption[])
    );
  }, [runners]);

  const handleRunnerSelect = useCallback(
    async (value?: string) => {
      onCloseModal();

      const runner = runners?.find((r) => r.$id === value);

      if (!runner) {
        onChange({ ...entity, source: undefined, endpoint: undefined, mcp: undefined });
        return;
      }

      setIsRunnerResolving(true);

      try {
        const { runner: resolvedRunner, scheme } = await resolveAppRunnerScheme(runner);

        const resolvedId = resolvedRunner?.$id ?? value;
        const applicationProperties = getSchemaDefaults((scheme ?? resolvedRunner) as JSONSchema7) as Record<
          string,
          unknown
        >;

        onChange({
          ...entity,
          source: resolvedId ? createSchemaSource(resolvedId) : undefined,
          endpoint: undefined,
          mcp: undefined,
          applicationProperties: { ...entity.applicationProperties, ...applicationProperties },
        });
      } finally {
        setIsRunnerResolving(false);
      }
    },
    [entity, onChange, onCloseModal, runners],
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
              sourceEntities={runners}
              columns={LIST_RUNNER_COLUMNS}
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
