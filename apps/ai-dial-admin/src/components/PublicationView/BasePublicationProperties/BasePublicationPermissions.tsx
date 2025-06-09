import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconReplace } from '@tabler/icons-react';
import { isEqual } from 'lodash';

import Structure from '@/public/images/icons/structure.svg';
import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import Button from '@/src/components/Common/Button/Button';
import RulesCompare from '@/src/components/PublicationView/Popup/RulesCompare';
import RulesStructure from '@/src/components/PublicationView/Popup/RulesStructure';
import RulesItem from '@/src/components/Rules/RulesItem';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import { PopUpState } from '@/src/types/pop-up';
import { addTrailingSlash } from '@/src/utils/files/path';

interface Props {
  rules: DialRule[];
  folderId: string;
  showCompare: boolean;
}

const BasePublicationPermissions: FC<Props> = ({ rules, folderId, showCompare }) => {
  const t = useI18n();
  const { fetchFolderHierarchy, isLoading } = useRuleFolder();

  const [compareModalState, setCompareModalState] = useState(PopUpState.Closed);
  const [structureModalState, setStructureModalState] = useState(PopUpState.Closed);
  const [compareRules, setCompareRules] = useState<DialRule[]>([]);
  const [showCompareButton, setShowCompareButton] = useState(false);
  const [showStructureButton, setShowStructureButton] = useState(false);

  useEffect(() => {
    if (folderId === addTrailingSlash(ROOT_FOLDER)) {
      setShowStructureButton(false);
      setShowCompareButton(false);
    } else {
      setShowStructureButton(true);
      getRules(folderId).then((folderRules) => {
        const rule = folderRules?.[folderId] || [];
        setCompareRules(rule);
        setShowCompareButton(showCompare && !isEqual(rule, rules));
      });
      fetchFolderHierarchy?.(folderId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RulesItem rules={rules} indentIndex={0} isAlwaysToggled={true}>
      <div className="flex gap-4">
        {showStructureButton && (
          <Button
            cssClass="secondary"
            title={t(ButtonsI18nKey.ReviewStructure)}
            iconBefore={<Structure {...BASE_ICON_PROPS} />}
            onClick={() => setStructureModalState(PopUpState.Opened)}
            dataTestId={'publication-permissions-review-structure-button'}
          />
        )}
        {showCompareButton && (
          <Button
            cssClass="secondary"
            title={t(ButtonsI18nKey.CompareChanges)}
            iconBefore={<IconReplace {...BASE_ICON_PROPS} />}
            onClick={() => setCompareModalState(PopUpState.Opened)}
            dataTestId={'publication-permissions-compare-changes-button'}
          />
        )}
      </div>

      {compareModalState === PopUpState.Opened &&
        createPortal(
          <RulesCompare
            rules={rules}
            compareRules={compareRules}
            modalState={compareModalState}
            onClose={() => setCompareModalState(PopUpState.Closed)}
            dataTestId={'publication-permissions-compare-modal'}
          />,
          document.body,
        )}
      {structureModalState === PopUpState.Opened &&
        createPortal(
          <RulesStructure
            isLoading={isLoading}
            modalState={structureModalState}
            onClose={() => setStructureModalState(PopUpState.Closed)}
            dataTestId={'publication-permissions-structure-modal'}
          />,
          document.body,
        )}
    </RulesItem>
  );
};

export default BasePublicationPermissions;
