import { FC } from 'react';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute } from '@/src/models/dial/route';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { ActionMenuOperation } from '@/src/types/action-menu-operations';

interface Props {
  activeRoute?: string;
  routes?: DialAppRoute[];
  onClick: (route?: string) => void;
  onRemove: (route?: string) => void;
}

const AppRouteList: FC<Props> = ({ routes, activeRoute, onRemove, onClick }) => {
  const t = useI18n() as (str: string) => string;

  const routeClassNames = classNames(
    'rounded group pl-3 py-2 flex flex-row gap-2 h-[32px] w-full',
    'cursor-pointer small hover:text-accent-primary',
  );

  const getOperation = (onClick: () => void): ActionMenuOperationDeclaration<DialAppRoute> => {
    return {
      icon: <IconTrash {...BASE_ICON_PROPS} />,
      id: ActionMenuOperation.Delete,
      onClick,
    };
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative gap-y-4 overflow-auto">
      {!activeRoute && <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoAppRoutes)} />}
      {activeRoute && !!routes?.length
        ? routes.map((route) => {
            return (
              <button
                key={route.name}
                role="tab"
                className={classNames(
                  routeClassNames,
                  activeRoute === route.name
                    ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary'
                    : 'text-primary',
                )}
              >
                <span className="flex-1 min-w-0 mr-0 text-left" onClick={() => onClick(route.name)}>
                  {route.name}
                </span>
                <div className="invisible group-hover:visible text-primary mx-2 flex flex-row gap-2">
                  <ActionsDropdown
                    items={[getOperation(() => onRemove(route.name))]}
                    icon={<IconDotsVertical {...BASE_ICON_PROPS} />}
                  />
                </div>
              </button>
            );
          })
        : null}
    </div>
  );
};

export default AppRouteList;
