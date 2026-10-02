'use client';

import { FC, ReactNode, useEffect, useState } from 'react';

import { DialSwitch, Switch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';

interface Props {
  isEditorEnabled?: boolean;
  children?: ReactNode;
  onToggleEditor?: () => void;
  /** Draws the 2.0 switch instead of the 1.0 one. Off by default; a page opts in with its own migration. */
  isDesignSystem2?: boolean;
}

const JsonToggles: FC<Props> = ({ children, isEditorEnabled, onToggleEditor, isDesignSystem2 }) => {
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
        {isDesignSystem2 ? (
          <Switch
            id="jsonEditor"
            isOn={isEditorEnabled}
            labelProps={{ label: t(EntitiesI18nKey.JSONEditor) }}
            onChange={onToggleEditor}
          />
        ) : (
          <DialSwitch
            isOn={isEditorEnabled}
            label={t(EntitiesI18nKey.JSONEditor)}
            switchId="jsonEditor"
            onChange={onToggleEditor}
          />
        )}
      </div>
    </div>
  );
};

export default JsonToggles;
