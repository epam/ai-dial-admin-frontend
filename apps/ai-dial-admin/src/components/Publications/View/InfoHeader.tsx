import { FC } from 'react';

import classNames from 'classnames';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ACTION_I18N_KEYS } from '@/src/constants/publications';
import { useI18n } from '@/src/locales/client';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getActionClassName } from '@/src/utils/publications';

interface Props {
  entity: Publication;
  view: ApplicationRoute;
}

const PublicationInfoHeader: FC<Props> = ({ entity }) => {
  const t = useI18n();
  const indicatorClassName = classNames('flex w-2 h-2 mr-1 rounded no-user-select', getActionClassName(entity?.action));
  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      {entity?.action && (
        <LabelledText label={t(EntitiesI18nKey.Action)}>
          <p className="truncate items-center flex">
            <span className={indicatorClassName} />
            {t(ACTION_I18N_KEYS[entity.action as keyof typeof ACTION_I18N_KEYS] || entity.action)}
          </p>
        </LabelledText>
      )}
      {entity?.createdAt && (
        <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(entity?.createdAt)} />
      )}
      {entity?.displayAuthor && (
        <LabelledText label={t(EntityFieldsI18nKey.displayAuthor)} text={entity?.displayAuthor} />
      )}
    </div>
  );
};

export default PublicationInfoHeader;
