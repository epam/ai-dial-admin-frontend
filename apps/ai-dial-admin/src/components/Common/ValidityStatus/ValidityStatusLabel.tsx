import { FC } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import ValidityStatus from './ValidityStatus';

interface Props {
  valid?: boolean;
  message?: string;
}

const ValidityStatusLabel: FC<Props> = ({ ...props }) => {
  const t = useI18n();

  return (
    props.valid != null && (
      <LabelledText label={t(EntityFieldsI18nKey.status)}>
        <ValidityStatus {...props} label={t(EntityFieldsI18nKey.status)} />
      </LabelledText>
    )
  );
};

export default ValidityStatusLabel;
