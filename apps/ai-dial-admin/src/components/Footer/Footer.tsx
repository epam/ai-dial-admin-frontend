import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialIconButton } from '@epam/ai-dial-ui-kit';
import { IconPencilMinus } from '@tabler/icons-react';

import { useI18n } from '@/src/locales/client';
import { CoreVersions } from '@/src/models/core-version';
import VersionModal from './Modals/VersionModal';
import { setCoreVersion } from '@/src/app/actions';
import { getCoreVersionElement } from './utils';
interface Props {
  beVersion: string | null;
  coreVersions?: CoreVersions;
  onChangeCoreVersion: Dispatch<SetStateAction<CoreVersions | undefined>>;
}

const Footer: FC<Props> = ({ beVersion, coreVersions, onChangeCoreVersion }) => {
  const t = useI18n();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const coreVersion = useMemo(() => {
    if (coreVersions) {
      return getCoreVersionElement(coreVersions, t);
    }
  }, [coreVersions, t]);

  const onApply = useCallback(
    (version: string, isDefault: boolean) => {
      if (isDefault) {
        setCoreVersion(void 0);
        onChangeCoreVersion({ ...coreVersions, manuallySetVersion: void 0 });
      } else {
        setCoreVersion(version);
        onChangeCoreVersion({ ...coreVersions, manuallySetVersion: version });
      }
      setIsModalOpen(false);
    },
    [coreVersions, onChangeCoreVersion],
  );

  return (
    <div className="hidden lg:flex absolute bottom-0 right-0 caption text-right pr-6 pb-1 text-secondary tiny">
      <span className="mr-1">Admin: [FE]{process.env.NEXT_PUBLIC_APP_VERSION}</span>
      <span>[BE]{beVersion}</span>
      <span className="inline-block w-px h-[14px] mx-1 bg-controls-disable"></span>
      <span className="flex">
        Core:
        <span className="flex flex-row hover:text-accent-primary group/version" onClick={() => setIsModalOpen(true)}>
          {coreVersion}
          <DialIconButton
            disabled={!coreVersions}
            className="size-auto"
            icon={<IconPencilMinus size={14} className="text-primary ml-2 group-hover/version:text-accent-primary" />}
          />
        </span>
      </span>

      {isModalOpen &&
        createPortal(
          <VersionModal
            coreVersions={coreVersions}
            isModalOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onApply={onApply}
          />,
          document.body,
        )}
    </div>
  );
};

export default Footer;
