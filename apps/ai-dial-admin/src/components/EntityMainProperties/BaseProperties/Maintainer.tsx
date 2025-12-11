import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props<T> {
  entity: T;
  readonly?: boolean;
  disabled?: boolean;
  onChangeEntity: (entity: T) => void;
}

const MaintainerControl = <T extends { author?: string }>({ entity, onChangeEntity, ...props }: Props<T>) => {
  const t = useI18n();

  return (
    <DialTextInputField
      containerClassName={STANDARD_CONTROL_WIDTH}
      elementId="author"
      fieldTitle={t(EntityFieldsI18nKey.author)}
      placeholder={t(EntityPlaceholdersI18nKey.Maintainer)}
      optional={true}
      value={entity.author}
      onChange={(author?: string) => onChangeEntity({ ...entity, author })}
      {...props}
    />
  );
};

export default MaintainerControl;
