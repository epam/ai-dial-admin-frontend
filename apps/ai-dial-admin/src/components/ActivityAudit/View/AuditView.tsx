'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  DialIconButton,
  DialConfirmationPopup,
  DialEllipsisTooltip,
  DialNeutralButton,
  DialSwitch,
} from '@epam/ai-dial-ui-kit';
import { IconExternalLink, IconRestore } from '@tabler/icons-react';
import classNames from 'classnames';

import CompareControl from '@/src/components/ActivityAudit/View/DiffReport/CompareControl';
import EntityDiff from '@/src/components/ActivityAudit/View/DiffReport/EntityDiff';
import FilterControl from '@/src/components/ActivityAudit/View/DiffReport/FilterControl';
import ViewHeader from '@/src/components/ActivityAudit/View/Header/Header';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonView from '@/src/components/Common/JsonView/JsonView';
import { ButtonsI18nKey, EntityFieldsI18nKey, RollbackI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditEntity, CompareView, DiffView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerRevision } from '@/src/utils/audit/get-rollback-request';
import {
  getRollbackErrorDescription,
  getRollbackErrorTitle,
  getRollbackSuccessDescription,
  getRollbackSuccessTitle,
} from '@/src/utils/entities/rollback-entity';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { generateCurrentResource } from './utils/generate-diffs';
import { getRollbackRedirectHref } from './utils/get-rollback-redirect-href';

interface Props {
  activity: DialActivity;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
  isModalView?: boolean;
  hideComparator?: boolean;
  entity?: BaseEntity;
  isEntityActivity?: boolean;
}

const AuditView: FC<Props> = ({
  activity,
  activityRevision,
  previousRevision,
  isModalView,
  hideComparator,
  entity,
  isEntityActivity = false,
}) => {
  const t = useI18n();
  const router = useRouter();

  const { showNotification } = useNotification();

  const [isJsonView, setIsJsonView] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diffView, setDiffView] = useState(DiffView.ALL);
  const [compareView, setCompareView] = useState(CompareView.NEXT);

  const before = generateCurrentResource(
    compareView === CompareView.NEXT ? activityRevision : (entity as ActivityAuditEntity),
    previousRevision,
    activity.resourceType,
    true,
    t,
  );
  const after = generateCurrentResource(
    previousRevision,
    compareView === CompareView.NEXT ? activityRevision : (entity as ActivityAuditEntity),
    activity.resourceType,
    false,
    t,
  );

  const onOpenModal = useCallback(() => {
    setIsOpenModal(true);
  }, [setIsOpenModal]);

  const onCloseModal = useCallback(() => {
    setIsOpenModal(false);
  }, [setIsOpenModal]);

  const resourceRollback = useCallback(() => {
    setIsLoading(true);
    rollbackEntityPerRevision(activity, activityRevision, previousRevision)
      .then((res) => {
        setIsLoading(false);
        if (res?.success) {
          showNotification(
            getSuccessNotification(
              getRollbackSuccessTitle(activity.resourceType, t),
              getRollbackSuccessDescription(activity.resourceType, t),
            ),
          );
          if (isEntityActivity) {
            const newRoute = getRollbackRedirectHref(activity.resourceType, activity.resourceId);
            router.push(newRoute);
          } else {
            router.push(ApplicationRoute.ActivityAudit);
          }
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage, res?.requestId));
        }

        onCloseModal();
      })
      .catch(() => {
        setIsLoading(false);
        showNotification(
          getErrorNotification(
            getRollbackErrorTitle(activity.resourceType, t),
            getRollbackErrorDescription(activity.resourceType, t),
          ),
        );
      });
  }, [
    setIsLoading,
    activity,
    activityRevision,
    previousRevision,
    showNotification,
    t,
    onCloseModal,
    router,
    isEntityActivity,
  ]);

  const openActivityInNewTab = (activity: DialActivity) => {
    onOpenInNewTab(ApplicationRoute.ActivityAudit, activity);
  };

  return (
    <>
      <div
        className={classNames(
          'flex flex-col flex-1 min-h-0 w-full rounded p-4 pb-14 lg:pb-4',
          isModalView ? 'h-full bg-layer-3' : 'bg-layer-2',
        )}
      >
        {!isModalView && (
          <div className="flex flex-row flex-wrap justify-between mb-6 gap-3">
            <h1 className="flex flex-row items-center gap-x-3">
              <DialEllipsisTooltip text={activity.activityId} />
              <CopyButton value={activity.activityId} valueLabel={t(EntityFieldsI18nKey.id)} />
            </h1>
            <div className="flex flex-row items-center gap-4 flex-wrap">
              <CompareControl compareView={compareView} setCompareView={setCompareView} />
              <FilterControl diffView={diffView} setDiffView={setDiffView} />
              <DialNeutralButton
                iconBefore={<IconRestore {...BASE_BUTTON_ICON_PROPS} />}
                label={t(RollbackI18nKey.Resource)}
                onClick={onOpenModal}
              />
              <div className="w-[px] h-6 bg-layer-4"></div>
              <DialSwitch
                switchId="jsonView"
                isOn={isJsonView}
                onChange={() => setIsJsonView(!isJsonView)}
                label="JSON"
              />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col relative divide-y divide-primary min-h-0">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
              {isModalView && (
                <>
                  <h3 className="flex flex-row items-center gap-x-3">
                    <DialEllipsisTooltip text={activity.activityId} />
                    <DialIconButton
                      onClick={() => openActivityInNewTab(activity)}
                      className="text-secondary size-auto"
                      icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                    />
                  </h3>
                  <div className="flex flex-row gap-3 items-center justify-end">
                    {!hideComparator && <CompareControl compareView={compareView} setCompareView={setCompareView} />}
                    <FilterControl diffView={diffView} setDiffView={setDiffView} />
                    <div className="w-[px] h-6 bg-layer-4"></div>
                    <DialSwitch
                      switchId="jsonView"
                      isOn={isJsonView}
                      onChange={() => setIsJsonView(!isJsonView)}
                      label="JSON"
                    />
                  </div>
                </>
              )}
            </div>
            <ViewHeader activity={activity} />
          </div>
          {isJsonView ? (
            <JsonView
              modified={JSON.stringify(
                (compareView === CompareView.NEXT ? activityRevision : (entity as ActivityAuditEntity)) || {},
                null,
                2,
              )}
              original={JSON.stringify(previousRevision || {}, null, 2)}
              containerClassName="mt-8 pt-8"
            />
          ) : (
            <EntityDiff
              currentEntity={before}
              compareEntity={after}
              type={activity.resourceType}
              diffView={diffView}
              compareView={compareView}
            />
          )}
        </div>
      </div>
      {isOpenModal &&
        createPortal(
          <DialConfirmationPopup
            open={isOpenModal}
            isLoading={isLoading}
            header={t(RollbackI18nKey.ConfirmResourceRollbackTitle)}
            onConfirm={resourceRollback}
            confirmLabel={t(ButtonsI18nKey.Rollback)}
            onClose={onCloseModal}
          >
            <div className="text-secondary small-150 px-6 py-4">
              <p>
                <span>{t(RollbackI18nKey.ConfirmSelectionRollbackDescription)}</span>
                <span className="important-text-part">{formatDateTimeToLocalString(activity?.epochTimestampMs)}</span>
              </p>
              <p>{t(RollbackI18nKey.ConfirmRollbackAsking)}</p>
            </div>
          </DialConfirmationPopup>,
          document.body,
        )}
    </>
  );
};

export default AuditView;
