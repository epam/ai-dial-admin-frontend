import { FC } from 'react';

import { DialEllipsisTooltip, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import { EntitiesI18nKey, ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { DialAppRoute } from '@/src/models/dial/route';

interface Props {
  disabled?: boolean;
  activeRouteIndex: number | null;
  routes?: DialAppRoute[];
  onClick: (index: number) => void;
  onRemove: (route?: string) => void;
}

const AppRouteList: FC<Props> = ({ disabled, routes, activeRouteIndex, onRemove, onClick }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const getOperation = (onClick: () => void): ActionMenuOperationDeclaration<DialAppRoute> => {
    return {
      icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} />,
      id: t(ActionMenuOperationI18nKey.Delete),
      onClick,
    };
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative gap-y-4 overflow-auto">
      {activeRouteIndex == null && <DialNoDataContent title={t(EntitiesI18nKey.NoAppRoutes)} />}
      {activeRouteIndex != null && !!routes?.length
        ? routes.map((route, index) => {
            return (
              <button
                key={route.name}
                role="tab"
                className={classNames(
                  'rounded group pl-3 py-2 flex flex-row gap-2 h-[32px] w-full small',
                  !isValid ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:text-accent-primary',
                  activeRouteIndex === index
                    ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary'
                    : 'text-primary',
                )}
              >
                <span className="flex-1 min-w-0 mr-0 text-left truncate" onClick={() => onClick(index)}>
                  <DialEllipsisTooltip text={route.name} />
                </span>
                {!disabled && (
                  <div className="invisible group-hover:visible text-primary mx-2 flex flex-row gap-2">
                    <ActionsDropdown
                      items={[getOperation(() => onRemove(route.name))]}
                      icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} />}
                    />
                  </div>
                )}
              </button>
            );
          })
        : null}
    </div>
  );
};

export default AppRouteList;
