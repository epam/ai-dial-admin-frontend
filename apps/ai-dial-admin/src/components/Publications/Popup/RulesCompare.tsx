import { FC } from 'react';

import { DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import RulesItem from '@/src/components/Rules/Item/RulesItem';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';

interface Props {
  rules: DialRule[];
  compareRules: DialRule[];
  isOpen: boolean;
  onClose: () => void;
}

const RulesCompare: FC<Props> = ({ rules, compareRules, isOpen, onClose }) => {
  const t = useI18n();

  return (
    <DialPopup
      onClose={onClose}
      header={t(FoldersI18nKey.ComparePermissions)}
      portalId="RulesCompare"
      open={isOpen}
      className="min-h-[200px]"
      size={PopupSize.Lg}
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
    </DialPopup>
  );
};

export default RulesCompare;
