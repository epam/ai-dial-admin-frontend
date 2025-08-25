'use client';
import { FC, useCallback, useMemo, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';

import { ButtonsI18nKey, RoutesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AttachmentPaths, DialAppRoute } from '@/src/models/dial/route';
import Switch from '@/src/components/Common/Switch/Switch';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { PopUpState } from '@/src/types/pop-up';
import Button from '@/src/components/Common/Button/Button';
import Grid from '@/src/components/Grid/Grid';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialRole } from '@/src/models/dial/role';
import AddEntitiesGrid from '../../AddEntitiesGrid';

interface Props {
  roles: DialRole[];
  route: DialAppRoute;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteRoles: FC<Props> = ({ route, onChangeRoute, roles }) => {
  const t = useI18n() as (str: string) => string;
  const data = useMemo(
    () => roles.filter((role) => route.userRoles?.includes(role.name as string)),
    [roles, route.userRoles],
  );

  const [addModalState, setAddModalState] = useState(PopUpState.Closed);

  const onOpenAddModal = useCallback(() => {
    setAddModalState(PopUpState.Opened);
  }, [setAddModalState]);

  const onCloseAddModal = useCallback(() => {
    setAddModalState(PopUpState.Closed);
  }, [setAddModalState]);

  const onAddRoles = useCallback(
    (roles: string[]) => {
      onChangeRoute({
        ...route,
        userRoles: [...(route.userRoles || []), ...roles],
      });
    },
    [route, onChangeRoute],
  );

  return (
    <>
      <div className="flex-1 min-h-0 w-full flex flex-col mt-3">
        <div className="flex flex-row items-center w-full mb-4 justify-between">
          <div className="flex flex-row items-center">
            <h1 className="mr-4"> {t(TabsI18nKey.Roles)}</h1>
            <Switch />
          </div>
          <Button
            cssClass="primary"
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            title={t(ButtonsI18nKey.Add)}
            onClick={onOpenAddModal}
          />
        </div>
        <div className="flex-1 min-h-0">
          <div className="h-full">
            <Grid columnDefs={SIMPLE_ENTITY_COLUMNS} rowData={data} />
          </div>
        </div>
      </div>
      {addModalState === PopUpState.Opened &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyTitle={t(EntitiesI18nKey.NoRoles)}
            modalState={addModalState}
            entities={availableRoles}
            onClose={onCloseAddModal}
            onApply={onAddRoles}
          />,
          document.body,
        )}
    </>
  );
};

export default RouteRoles;
