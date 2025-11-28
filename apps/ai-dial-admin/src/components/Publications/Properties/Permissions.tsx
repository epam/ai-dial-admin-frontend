import { FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconReplace, IconBrandStackshare } from '@tabler/icons-react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import RulesCompare from '@/src/components/Publications/Popup/RulesCompare';
import RulesStructure from '@/src/components/Publications/Popup/RulesStructure';
import RulesItem from '@/src/components/Rules/Item/RulesItem';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ButtonsI18nKey, CompareI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import { addTrailingSlash } from '@/src/utils/url';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';

interface Props {
  rules: DialRule[];
  folderId: string;
  showCompare: boolean;
}

const PublicationPermissions: FC<Props> = ({ rules, folderId, showCompare }) => {
  const t = useI18n();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);
  const { fetchFolderHierarchy, isLoading } = useRuleFolder();

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [compareRules, setCompareRules] = useState<DialRule[]>([]);
  const [showCompareButton, setShowCompareButton] = useState(false);
  const [showStructureButton, setShowStructureButton] = useState(false);

  useEffect(() => {
    if (folderId === addTrailingSlash(ROOT_FOLDER)) {
      setShowStructureButton(false);
      setShowCompareButton(false);
    } else {
      setShowStructureButton(true);
      getReqRef.current(getRules, folderId).then((res) => {
        if (res.success) {
          const rule = res.response?.[folderId] || [];
          setCompareRules(rule);
          setShowCompareButton(showCompare && !isEqualSkippingUndefined(rule, rules));
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });

      fetchFolderHierarchy?.(folderId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RulesItem rules={rules} indentIndex={0} isAlwaysToggled={true}>
      <div className="flex gap-4">
        {showStructureButton && (
          <DialButton
            variant={ButtonVariant.Secondary}
            label={t(ButtonsI18nKey.ReviewStructure)}
            iconBefore={<IconBrandStackshare {...BASE_ICON_PROPS} />}
            onClick={() => setIsStructureModalOpen(true)}
          />
        )}
        {showCompareButton && (
          <DialButton
            variant={ButtonVariant.Secondary}
            label={t(CompareI18nKey.CompareChanges)}
            iconBefore={<IconReplace {...BASE_ICON_PROPS} />}
            onClick={() => setIsCompareModalOpen(true)}
          />
        )}
      </div>

      {isCompareModalOpen &&
        createPortal(
          <RulesCompare
            rules={rules}
            compareRules={compareRules}
            isOpen={isCompareModalOpen}
            onClose={() => setIsCompareModalOpen(false)}
          />,
          document.body,
        )}
      {isStructureModalOpen &&
        createPortal(
          <RulesStructure
            isLoading={isLoading}
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
          />,
          document.body,
        )}
    </RulesItem>
  );
};

export default PublicationPermissions;
