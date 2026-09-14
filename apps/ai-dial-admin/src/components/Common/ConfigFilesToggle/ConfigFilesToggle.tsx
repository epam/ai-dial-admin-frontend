'use client';

import { FC } from 'react';

import { Switch } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';

/**
 * Toggles `showConfigFiles`, swapping a covered view's asset/platform list for its config-file-backed
 * admin-grid list. Renders only without the admin backend — with it, the admin-grid list is already
 * the page's only list, so there is nothing to toggle to.
 */
const ConfigFilesToggle: FC = () => {
  const t = useI18n();
  const { featureFlags, showConfigFiles, toggleShowConfigFiles } = useAppContext();

  if (featureFlags.adminApiEnabled) {
    return null;
  }

  return (
    <div className="flex shrink-0">
      <Switch
        id="show-config-files"
        labelProps={{ label: t(BasicI18nKey.ShowConfigFiles) }}
        isOn={showConfigFiles}
        onChange={toggleShowConfigFiles}
      />
    </div>
  );
};

export default ConfigFilesToggle;
