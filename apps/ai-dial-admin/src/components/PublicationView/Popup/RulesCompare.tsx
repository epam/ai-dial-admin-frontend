import { FC } from 'react';

import classNames from 'classnames';

import Popup from '@/src/components/Common/Popup/Popup';
import RulesItem from '@/src/components/Rules/RulesItem';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  rules: DialRule[];
  compareRules: DialRule[];
  modalState: PopUpState;
  dataTestId: string;
  onClose: () => void;
}

const RulesCompare: FC<Props> = ({ rules, compareRules, modalState, dataTestId, onClose }) => {
  const t = useI18n();
  const containerClassName = classNames('lg:max-w-[75%] md:max-w-[90%] min-h-[200px]');

  return (
    <Popup
      onClose={onClose}
      heading={t(FoldersI18nKey.ComparePermissions)}
      portalId="RulesCompare"
      state={modalState}
      containerClassName={containerClassName}
      dataTestId={dataTestId}
    >
      <div className="flex flex-1 flex-row px-6 min-h-0 divide-tertiary divide-x">
        <RulesItem
          rules={compareRules}
          rulesToExclude={rules}
          indentIndex={0}
          folderName={t(FoldersI18nKey.Current)}
          isAlwaysToggled={true}
        />
        <RulesItem
          rules={rules}
          rulesToInclude={compareRules}
          indentIndex={0}
          folderName={t(FoldersI18nKey.Proposed)}
          isAlwaysToggled={true}
        />
      </div>
      <></>
    </Popup>
  );
};

export default RulesCompare;
