import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  onChangeEntity: (entity: T) => void;
}

const MaintainerControl = <T extends { author?: string }>({ entity, onChangeEntity, disabled, ...props }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <DialInput
      containerClassName={STANDARD_CONTROL_WIDTH}
      id="author"
      labelProps={{ label: t(EntityFieldsI18nKey.author) }}
      placeholder={t(EntityPlaceholdersI18nKey.Maintainer)}
      value={entity.author}
      onChange={(author?: string) => onChangeEntity({ ...entity, author })}
      disabled={disabled || isReadOnlyAdmin}
      {...props}
    />
  );
};

export default MaintainerControl;
