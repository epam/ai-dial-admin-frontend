'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { IconPlus } from '@tabler/icons-react';
import { Input, Popup, PopupSize, Select } from '@epam/ai-dial-ui-kit';

import {
  createDashboard,
  getDashboard,
  listDashboards,
  replaceDashboard,
} from '@/src/app/[lang]/dashboards/custom-actions';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import PersonalQueryCopyBanner from '@/src/components/Analytics/CustomDashboards/Modals/PersonalQueryCopyBanner';
import { getInitialRowLimit } from '@/src/components/Analytics/CustomDashboards/utils/row-count';
import { getDashboardWriteErrorNotification } from '@/src/components/Analytics/CustomDashboards/utils/write-error';
import { ButtonsI18nKey, CustomDashboardsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { Dashboard, DashboardListItem, DashboardVisibility, DashboardWidget } from '@/src/models/analytics/dashboard';
import { NotificationType } from '@/src/models/notification';
import { ServerActionResponse } from '@/src/models/server-action';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { appendWidget } from '@/src/utils/analytics/dashboard-layout';
import { getDashboardHref, newDashboardRequest, toDashboardRequest } from '@/src/utils/analytics/dashboard-request';
import { getErrorNotification, getNotification } from '@/src/utils/notification';
import { toInlineQuery } from '@/src/utils/analytics/widget-source';

interface Props {
  savedQuery: SavedQuery;
  onClose: () => void;
}

/**
 * Puts a saved query on a custom dashboard as a new widget at the bottom of its grid. Picking an existing
 * dashboard replaces it once with the widget appended; a dashboard created here is written once with it.
 */
const AddToDashboardModal: FC<Props> = ({ savedQuery, onClose }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const { showNotification } = useNotification();

  const [dashboards, setDashboards] = useState<DashboardListItem[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [dashboardId, setDashboardId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await listDashboards();
      if (!res.success) {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        return;
      }
      setDashboards(res.response?.dashboards ?? []);
      setCanCreate(res.response?.permissions.create_private ?? false);
    };
    void load();
  }, [showNotification]);

  const options = useMemo(
    () =>
      dashboards
        .filter((dashboard) => dashboard.permissions.write)
        .map((dashboard) => ({ value: dashboard.id, label: dashboard.name })),
    [dashboards],
  );

  const addTo = useCallback(async (): Promise<ServerActionResponse<Dashboard>> => {
    const widget: Omit<DashboardWidget, 'layout'> = {
      id: crypto.randomUUID(),
      saved_query_id: savedQuery.id,
      title: title.trim() || undefined,
      row_limit: getInitialRowLimit(savedQuery),
    };
    if (isCreating) {
      const request = newDashboardRequest(newName.trim());
      return createDashboard({ ...request, widgets: appendWidget(request.widgets, widget) });
    }
    const read = await getDashboard(dashboardId);
    if (!read.success || !read.response) return read;
    const request = toDashboardRequest(read.response);
    // A public dashboard's other viewers could not read a personal query, so it is copied in, as publishing does.
    const isCopied =
      read.response.visibility === DashboardVisibility.Public && savedQuery.scope === SavedQueryScope.Personal;
    const added = isCopied
      ? {
          id: widget.id,
          title: widget.title ?? savedQuery.name,
          row_limit: widget.row_limit,
          inline_query: toInlineQuery(savedQuery),
        }
      : widget;
    return replaceDashboard(
      dashboardId,
      { ...request, widgets: appendWidget(request.widgets, added) },
      read.response.generation,
    );
  }, [savedQuery, title, isCreating, newName, dashboardId]);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    let res: ServerActionResponse<Dashboard>;
    try {
      res = await addTo();
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
      return;
    } finally {
      setIsSaving(false);
    }
    if (!res.success || !res.response) {
      showNotification(getDashboardWriteErrorNotification(res, t));
      return;
    }
    const dashboard = res.response;
    showNotification(
      getNotification(
        NotificationType.success,
        t(CustomDashboardsI18nKey.AddedToDashboard, { name: dashboard.name }),
        <Link href={`/${currentLocale}${getDashboardHref(dashboard.id)}`} className="text-accent-primary underline">
          {t(CustomDashboardsI18nKey.OpenDashboard)}
        </Link>,
      ),
    );
    onClose();
  }, [addTo, currentLocale, onClose, showNotification, t]);

  const isTargetChosen = isCreating ? !!newName.trim() : !!dashboardId;
  // Judged from the listing, ahead of the add; the add itself decides again from the dashboard it reads.
  const chosen = isCreating ? undefined : dashboards.find((dashboard) => dashboard.id === dashboardId);
  const isQueryCopied =
    chosen?.visibility === DashboardVisibility.Public && savedQuery.scope === SavedQueryScope.Personal;

  return (
    <Popup
      open
      header={t(CustomDashboardsI18nKey.AddToDashboard)}
      portalId="AddToDashboardModal"
      size={PopupSize.Md}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Add),
        isSubmitDisabled: !isTargetChosen || isSaving,
        onCancel: onClose,
        onSubmit,
      })}
    >
      <div className="flex flex-col gap-y-6 px-6 py-4">
        {isCreating ? (
          <Input
            id="add-to-dashboard-new-name"
            labelProps={{ label: t(CustomDashboardsI18nKey.NewDashboardName), required: true }}
            value={newName}
            onChange={(name) => setNewName(name ?? '')}
          />
        ) : (
          <Select
            id="add-to-dashboard-target"
            labelProps={{ label: t(CustomDashboardsI18nKey.Switcher), required: true }}
            placeholder={t(CustomDashboardsI18nKey.SelectDashboard)}
            options={options}
            value={dashboardId || undefined}
            onChange={(id) => setDashboardId(id as string)}
            // A real button, so the entry is reachable by keyboard; its click reaches `onFooterClick`.
            footer={
              canCreate && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-accent-primary hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha"
                >
                  <IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />
                  <span className="dial-small-text">{t(CustomDashboardsI18nKey.CreateDashboard)}</span>
                </button>
              )
            }
            onFooterClick={() => setIsCreating(true)}
          />
        )}
        {isQueryCopied && <PersonalQueryCopyBanner />}
        <Input
          id="add-to-dashboard-title"
          labelProps={{ label: t(CustomDashboardsI18nKey.WidgetTitle) }}
          placeholder={savedQuery.name}
          value={title}
          onChange={(value) => setTitle(value ?? '')}
        />
      </div>
    </Popup>
  );
};

export default AddToDashboardModal;
