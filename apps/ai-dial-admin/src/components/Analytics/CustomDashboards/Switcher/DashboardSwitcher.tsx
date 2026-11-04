'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { IconPlus } from '@tabler/icons-react';
import { ElementSize, Select } from '@epam/ai-dial-ui-kit';

import { createDashboard } from '@/src/app/[lang]/dashboards/custom-actions';
import DashboardDetailsModal from '@/src/components/Analytics/CustomDashboards/Modals/DashboardDetailsModal';
import { DashboardDetails } from '@/src/components/Analytics/CustomDashboards/models';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { USAGE_DASHBOARD_OPTION } from '@/src/constants/analytics/dashboards';
import { ButtonsI18nKey, CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DashboardCreatePermissions, DashboardListItem, DashboardVisibility } from '@/src/models/analytics/dashboard';
import { ApplicationRoute } from '@/src/types/routes';
import { getDashboardHref, newDashboardRequest } from '@/src/utils/analytics/dashboard-request';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  dashboards: DashboardListItem[];
  createPermissions: DashboardCreatePermissions;
  // The open custom dashboard; absent on the built-in usage dashboard.
  currentId?: string;
}

const SWITCHER_WIDTH = 'w-[240px]';

const PUBLIC_DETAILS: DashboardDetails = {
  name: '',
  description: '',
  compare: ComparePeriod.Off,
  visibility: DashboardVisibility.Public,
};

/** Moves between the built-in usage dashboard and custom ones, and offers to create one when the service allows it. */
const DashboardSwitcher: FC<Props> = ({ dashboards, createPermissions, currentId }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const canCreate = createPermissions.create_private || createPermissions.create_public;
  const canChooseVisibility = createPermissions.create_private && createPermissions.create_public;

  const options = useMemo(
    () => [
      { value: USAGE_DASHBOARD_OPTION, label: t(CustomDashboardsI18nKey.UsageDashboard) },
      ...dashboards.map((dashboard) => ({ value: dashboard.id, label: dashboard.name })),
    ],
    [dashboards, t],
  );

  const onSelectDashboard = useCallback(
    (value: string | string[]) => {
      const id = value as string;
      router.push(id === USAGE_DASHBOARD_OPTION ? ApplicationRoute.Dashboard : getDashboardHref(id));
    },
    [router],
  );

  const onCreate = useCallback(
    async ({ name, description, compare, visibility }: DashboardDetails): Promise<boolean> => {
      const res = await createDashboard(newDashboardRequest(name, description, compare, visibility));
      if (!res.success || !res.response) {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        return false;
      }
      showNotification(getSuccessNotification(t(CustomDashboardsI18nKey.Created), res.response.name));
      router.push(getDashboardHref(res.response.id, true));
      return true;
    },
    [router, showNotification, t],
  );

  return (
    <>
      <Select
        size={ElementSize.Small}
        className={`!w-auto ${SWITCHER_WIDTH}`}
        options={options}
        value={currentId ?? USAGE_DASHBOARD_OPTION}
        ariaLabel={t(CustomDashboardsI18nKey.Switcher)}
        onChange={onSelectDashboard}
        // A real button, so the entry is reachable by keyboard; its click reaches `onFooterClick`, which
        // also closes the list.
        footer={
          canCreate && (
            <>
              <hr className="border-primary" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-accent-primary hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha"
              >
                <IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />
                <span className="dial-small-text">{t(CustomDashboardsI18nKey.CreateDashboard)}</span>
              </button>
            </>
          )
        }
        onFooterClick={() => setIsCreateOpen(true)}
      />
      {isCreateOpen && (
        <DashboardDetailsModal
          header={t(CustomDashboardsI18nKey.CreateDashboard)}
          submitLabel={t(ButtonsI18nKey.Create)}
          initial={createPermissions.create_private ? undefined : PUBLIC_DETAILS}
          canPublish={canChooseVisibility}
          onSubmit={onCreate}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </>
  );
};

export default DashboardSwitcher;
