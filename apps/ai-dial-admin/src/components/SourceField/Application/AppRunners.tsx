'use client';

import { DialInputPopup, DialLabel, DialNeutralButton, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import { JSONSchema7 } from 'json-schema';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getResolvedRunnerSchema } from '@/src/app/[lang]/assets-app-runners/actions';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { toCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { createSchemaSource, getSchemaSourceId } from '@/src/utils/entities/application-source';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getSchemaDefaults } from '@/src/utils/schema';
import { AppRunnerOrigin } from './models';
import { getRunnerOrigin, getRunnerReference } from './utils';
import SelectAppRunnerModal from './SelectAppRunnersModal';

interface Props {
  /** Entity-based API: AppRunners owns scheme-fetch + applicationProperties derivation side-effect. */
  entity?: DialApplication;
  onChange?: (entity: DialApplication) => void;
  /** Legacy callback-based API: used by AssetApp flow in ApplicationSource.tsx, where the write pattern differs. */
  selectedValue?: string;
  onChangeValue?: (value?: string, application_properties?: Record<string, unknown>) => void;
  runners?: DialApplicationScheme[];
  label?: string;
  /**
   * Only `AssetsApplications` receives both runner populations, and only there is the presentation
   * `$id`-based. Every other surface offers admin-BE runners alone and keeps its display names.
   */
  view?: ApplicationRoute;
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
  view,
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

  const isMergedSource = view === ApplicationRoute.AssetsApplications;

  // On the merged surface, labelled by `$id` to match the grid's `ID` column — an asset runner has no
  // display name without a per-runner content read, and a label the grid never showed would not be
  // recognizable. Elsewhere every runner has one, so it stays the label.
  const dropdownItems = useMemo(() => {
    return (
      runners?.map((r) => ({
        value: getRunnerReference(r),
        label: (isMergedSource ? r.$id : r['dial:applicationTypeDisplayName']) || r.$id || '',
      })) || ([] as SelectOption[])
    );
  }, [runners, isMergedSource]);

  const handleRunnerSelect = useCallback(
    (value?: string) => {
      onCloseModal();

      let applicationProperties;
      const baseEntity: DialApplication = {
        ...entity,
        source: value ? createSchemaSource(value) : undefined,
        endpoint: undefined,
        mcp: undefined,
      };

      const runner = runners?.find((r) => getRunnerReference(r) === value);

      if (!runner && entity) {
        onChange?.(baseEntity);
        return;
      }

      const isAsset = !!runner && getRunnerOrigin(runner) === AppRunnerOrigin.Asset;
      const resolve = isAsset
        ? getResolvedRunnerSchema(toCoreRunnerName(runner.$id ?? ''))
        : getResolvedApplicationScheme(runner?.$id ?? '');

      resolve.then((res) => {
        const resolved = isAsset
          ? (res.response as DialApplicationScheme | undefined)
          : (res.response as { schema?: DialApplicationScheme })?.schema;
        const scheme: DialApplicationScheme | undefined = res.success && resolved ? resolved : runner;
        applicationProperties = getSchemaDefaults(scheme as JSONSchema7) as Record<string, unknown>;
        if (entity) {
          onChange?.({
            ...baseEntity,
            applicationProperties: { ...baseEntity.applicationProperties, ...applicationProperties },
          });
        } else if (onChangeValue) {
          onChangeValue(value, applicationProperties);
        }
      });
    },
    [entity, onChange, onChangeValue, onCloseModal, runners],
  );

  const selectedRunner = useMemo(
    () => runners?.find((r) => getRunnerReference(r) === currentValue),
    [runners, currentValue],
  );

  const openInNewTab = useCallback(() => {
    const url =
      selectedRunner && getRunnerOrigin(selectedRunner) === AppRunnerOrigin.Asset
        ? `/${currentLocale}${getUrnForEntity(ApplicationRoute.AssetsAppRunners, selectedRunner)}`
        : `/${currentLocale}${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(`${currentValue}`)}`;
    window.open(url, '_blank');
  }, [currentLocale, currentValue, selectedRunner]);

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
        <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-1')}>
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
              isMergedSource={isMergedSource}
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
