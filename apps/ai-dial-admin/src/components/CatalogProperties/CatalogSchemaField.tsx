'use client';

import { DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import { BasicI18nKey, ButtonsI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import SelectCatalogSchemaModal from './SelectCatalogSchemaModal';

/** Clears `catalog_schema_id`; empty because no schema `$id` can be blank (Core rejects one). */
const NO_SCHEMA = '';

interface Props {
  schemaId?: string;
  options?: CatalogSchemaOption[];
  /** Resolved here: the option read runs on the server, where no translator exists. */
  optionsError?: EntitiesI18nKey;
  disabled?: boolean;
  onChange: (schemaId?: string) => void;
}

const CatalogSchemaField: FC<Props> = ({ schemaId, options, optionsError, disabled, onChange }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isMobile = useIsMobileScreen();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFieldDisabled = disabled || isReadOnlyAdmin;

  const dropdownItems = useMemo(
    () => [
      { value: NO_SCHEMA, label: t(BasicI18nKey.None) },
      ...(options || []).map((option) => ({
        value: option.$id,
        label: option['dial:catalogDisplayName'] || option.$id,
      })),
    ],
    [options, t],
  );

  const onOpenModal = useCallback(() => setIsModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsModalOpen(false), []);

  const onApply = useCallback(
    (id?: string) => {
      onCloseModal();
      onChange(id);
    },
    [onChange, onCloseModal],
  );

  /**
   * The raw `$id`, matching a grid row click: `getUrnForEntity` encodes it once, and the route hands
   * that segment on undecoded as the Core resource name. Encoding it here too is one level too many.
   */
  const openInNewTab = useCallback(() => {
    const segment = getUrnForEntity(ApplicationRoute.PlatformCatalogSchemas, { $id: schemaId });
    window.open(`/${currentLocale}${segment}`, '_blank');
  }, [currentLocale, schemaId]);

  return (
    <div className="flex mt-1">
      <div className="flex gap-2 items-end">
        <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-1')}>
          <DialSelectField
            id="catalogSchemaId"
            label={t(EntitiesI18nKey.CatalogSchema)}
            placeholder={t(EntityPlaceholdersI18nKey.SelectCatalogSchema)}
            options={dropdownItems}
            value={schemaId ?? ''}
            searchable
            disabled={isFieldDisabled}
            error={optionsError ? t(optionsError) : void 0}
            invalid={!!optionsError}
            onChange={(value) => onChange((value as string) || void 0)}
          />
        </div>
        <DialNeutralButton label={t(ButtonsI18nKey.Browse)} disabled={isFieldDisabled} onClick={onOpenModal} />
        {schemaId && (
          <DialNeutralButton
            label={isMobile ? '' : t(ButtonsI18nKey.Open)}
            iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            aria-label={t(ButtonsI18nKey.Open)}
            onClick={openInNewTab}
          />
        )}
      </div>
      {isModalOpen && (
        <SelectCatalogSchemaModal
          selectedId={schemaId}
          options={options}
          isModalOpen={isModalOpen}
          onClose={onCloseModal}
          onApply={onApply}
        />
      )}
    </div>
  );
};

export default CatalogSchemaField;
