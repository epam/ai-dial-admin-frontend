'use client';

import { FC, ReactNode, useEffect, useState } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';

interface Props {
  isEditorEnabled?: boolean;
  children?: ReactNode;
  onToggleEditor?: () => void;
}

const JsonToggles: FC<Props> = ({ children, isEditorEnabled, onToggleEditor }) => {
  const t = useI18n();
  const staticEditorClassName = 'flex flex-row gap-x-4';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [editorClassName, setEditorClassName] = useState(staticEditorClassName);

  useEffect(() => {
    setEditorClassName(
      classNames(
        staticEditorClassName,
        isTablet ? 'ml-3 pl-3 border-l-tertiary border-l h-full flex items-center' : isMobile && 'hidden',
      ),
    );
  }, [isTablet, isMobile]);

  return (
    <div className={editorClassName}>
      {!isEditorEnabled && <div className="w-px h-6 bg-layer-4"></div>}
      {children}

      <div className="h-auto">
        <DialSwitch
          isOn={isEditorEnabled}
          label={t(EntitiesI18nKey.JSONEditor)}
          switchId="jsonEditor"
          onChange={onToggleEditor}
        />
      </div>
    </div>
  );
};

export default JsonToggles;
