import { FC } from 'react';

import StatusBadge from '@/src/components/Common/StatusBadge/StatusBadge';
import { StatusBadgeTone } from '@/src/components/Common/StatusBadge/models';
import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getEntityValidity } from './get-entity-validity';
import { EntityValidityInput } from './models';

interface Props {
  entity?: EntityValidityInput;
}

const EntityValidityBadge: FC<Props> = ({ entity }) => {
  const t = useI18n();
  const validity = getEntityValidity(entity);

  if (!validity) {
    return null;
  }

  return validity.isValid ? (
    <StatusBadge tone={StatusBadgeTone.Success} label={t(StatusBadgeI18nKey.Valid)} />
  ) : (
    <StatusBadge tone={StatusBadgeTone.Error} label={t(StatusBadgeI18nKey.Invalid)} hint={validity.hint} />
  );
};

export default EntityValidityBadge;
