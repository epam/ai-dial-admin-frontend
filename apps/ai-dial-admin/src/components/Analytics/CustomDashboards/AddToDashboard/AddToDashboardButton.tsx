'use client';

import { FC, useState } from 'react';

import { IconLayoutDashboard } from '@tabler/icons-react';
import { GhostButton } from '@epam/ai-dial-ui-kit';

import AddToDashboardModal from '@/src/components/Analytics/CustomDashboards/AddToDashboard/AddToDashboardModal';
import { CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';

interface Props {
  savedQuery: SavedQuery;
}

const AddToDashboardButton: FC<Props> = ({ savedQuery }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GhostButton
        label={t(CustomDashboardsI18nKey.AddToDashboard)}
        iconBefore={<IconLayoutDashboard {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && <AddToDashboardModal savedQuery={savedQuery} onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default AddToDashboardButton;
