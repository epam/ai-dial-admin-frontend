'use client';

import { FC, useMemo } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { DialKey } from '@/src/models/dial/key';
import KeyProperties from './Properties';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { useI18n } from '@/src/locales/client';

interface Props {
  names: string[];
  keys: string[];
  selectedKey: DialKey;
  onChange: (key: DialKey) => void;
}

const PropertiesTabContent: FC<Props> = ({ selectedKey, onChange, names, keys }) => {
  const t = useI18n();

  const headerPostfix = useMemo(() => {
    return (
      <>
        <LabelledText
          label={t(EntityFieldsI18nKey.keyGeneratedAt)}
          text={formatDateTimeToLocalString(selectedKey.keyGeneratedAt)}
        />
        <LabelledText
          label={t(EntityFieldsI18nKey.expiresAt)}
          text={formatDateTimeToLocalString(selectedKey.expiresAt)}
        />
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <ValidityStatus validityState={selectedKey.validityState} />
        </LabelledText>
      </>
    );
  }, [selectedKey.keyGeneratedAt, selectedKey.expiresAt, selectedKey.validityState, t]);

  return (
    <div className="h-full flex flex-col divide-y divide-primary w-full">
      <EntityInfoHeader id={selectedKey.name} entity={selectedKey} postfix={headerPostfix} />
      <div className="flex-1 min-h-0 pt-8">
        <KeyProperties
          entity={selectedKey}
          names={names}
          keys={keys}
          onChangeKey={onChange}
          isKeyImmutable={true}
        ></KeyProperties>
      </div>
    </div>
  );
};

export default PropertiesTabContent;
