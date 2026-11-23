import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { ToolsEntity } from '@/src/components/Tools/models';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';

interface Props {
  originalEntity?: ToolsEntity;
  selectedEntity?: ToolsEntity;
  isRunnerApplication?: boolean;
  isUsingAllTools: boolean;
  disabled?: boolean;
}

const ToolsNotifications: FC<Props> = ({
  originalEntity,
  selectedEntity,
  isRunnerApplication,
  isUsingAllTools,
  disabled,
}) => {
  const t = useI18n();
  const isNotSavedToolset = originalEntity?.endpoint !== selectedEntity?.endpoint;
  const originalApplication = originalEntity as DialApplication & DialApplicationResource;
  const selectedApplication = selectedEntity as DialApplication & DialApplicationResource;
  const isRunnerConfigurationChanged =
    !!isRunnerApplication &&
    !!originalEntity &&
    !!selectedEntity &&
    (!isEqual(originalApplication.source, selectedApplication.source) ||
      originalApplication.application_type_schema_id !== selectedApplication.application_type_schema_id ||
      !isEqual(originalApplication.applicationProperties, selectedApplication.applicationProperties) ||
      !isEqual(originalApplication.application_properties, selectedApplication.application_properties));

  return (
    <>
      {isNotSavedToolset && !disabled && !isRunnerApplication && (
        <Notification
          type={NotificationType.SectionMessage}
          variant={NotificationVariant.Info}
          message={t(ToolsetI18nKey.ToolsWarning)}
        />
      )}
      {isRunnerConfigurationChanged && (
        <Notification
          type={NotificationType.SectionMessage}
          variant={NotificationVariant.Info}
          message={t(ToolsetI18nKey.SavedApplicationToolsWarning)}
        />
      )}
      {!isUsingAllTools && !disabled && !isRunnerApplication && (
        <span className="dial-tiny-text text-secondary">{t(ToolsetI18nKey.Warning)}</span>
      )}
    </>
  );
};

export default ToolsNotifications;
