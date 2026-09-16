'use client';

import { FC } from 'react';

import { Switch } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';

/**
 * Toggles `showConfigFiles`, swapping a covered view's asset/platform list for its config-file-backed
 * admin-grid list. Rendered regardless of the admin backend: with it, toggle-off keeps the
 * admin-backend list and toggle-on shows Core's config-file population alongside it.
 */
const ConfigFilesToggle: FC = () => {
  const t = useI18n();
  const { showConfigFiles, toggleShowConfigFiles } = useAppContext();

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
