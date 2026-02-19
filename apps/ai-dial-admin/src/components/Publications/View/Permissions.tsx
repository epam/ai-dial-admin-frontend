import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AlertVariant, DialAlert, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconReplace } from '@tabler/icons-react';

import RulesCompare from '@/src/components/Publications/Popup/RulesCompare';
import RulesItem from '@/src/components/Rules/Item/RulesItem';
import { CompareI18nKey, FoldersI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Publication } from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';

interface Props<T> {
  selectedPublication: T;
  onChange: (publication: T) => void;
  isPermissionsChanged: boolean;
  currentRules: DialRule[];
}

const PublicationPermissions = <T extends Publication>({
  selectedPublication,
  onChange,
  isPermissionsChanged,
  currentRules,
}: Props<T>) => {
  const t = useI18n();

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const warning = useMemo(() => {
    return (
      <DialAlert
        variant={AlertVariant.Warning}
        message={
          <div className="flex flex-row gap-3">
            <h3>{t(PublicationsI18nKey.PermissionsWarningTitle)}</h3>
            <span className="text-sm">{t(PublicationsI18nKey.PermissionsWarningDescription)}</span>
          </div>
        }
      />
    );
  }, [t]);

  const handleRulesChange = (rules: DialRule[]) => {
    onChange({ ...selectedPublication, rules } as T);
  };

  return (
    <div className="flex flex-col gap-8 min-h-0">
      {isPermissionsChanged && warning}
      <RulesItem
        rules={selectedPublication.rules || []}
        indentIndex={0}
        isAlwaysToggled={true}
        folderName={t(FoldersI18nKey.Permissions)}
        folderDescription={selectedPublication.folderId}
        setLastRuleHeight={() => void 0}
        onChange={handleRulesChange}
      >
        <div className="flex gap-4">
          {isPermissionsChanged && (
            <DialNeutralButton
              label={t(CompareI18nKey.CompareChanges)}
              iconBefore={<IconReplace {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => setIsCompareModalOpen(true)}
            />
          )}
        </div>

        {isCompareModalOpen &&
          createPortal(
            <RulesCompare
              rules={selectedPublication.rules || []}
              compareRules={currentRules}
              isOpen={isCompareModalOpen}
              onClose={() => setIsCompareModalOpen(false)}
            />,
            document.body,
          )}
      </RulesItem>
    </div>
  );
};

export default PublicationPermissions;
