import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRoute } from '@/src/models/dial/route';
import { TabModel } from '@/src/models/tab';
import { PopUpState } from '@/src/types/pop-up';
import { TabOrientation } from '@/src/types/tab';
import CreateRoute from './CreateRoute';

interface Props {
  routes?: DialRoute[];
  onChangeRoutes: (routes: DialRoute[]) => void;
}

const EntityRoutes: FC<Props> = ({ routes, onChangeRoutes }) => {
  const t = useI18n() as (str: string) => string;

  const [modalState, setModalState] = useState(PopUpState.Closed);

  const tabs: TabModel[] = useMemo(() => {
    return routes?.map((route) => ({ id: route.name, name: route.name }) as TabModel) || [];
  }, [routes]);

  const [activeRoute, setActiveRoute] = useState(tabs[0]?.id);

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, []);

  const handleModalOpen = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, []);

  const onCreate = useCallback(
    (name: string) => {
      handleModalClose();
      onChangeRoutes([...(routes || []), { name } as DialRoute]);
    },
    [handleModalClose, onChangeRoutes, routes],
  );

  return (
    <>
      <div className="flex flex-row gap-4 h-full w-full">
        <div className="bg-layer-3 h-full w-[296px] p-4">
          <div className="flex flex-row flex-wrap justify-between items-center mb-4">
            <h1>{t(TabsI18nKey.Routes)}</h1>
            <Button
              cssClass="primary"
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={handleModalOpen}
            />
          </div>
          <div className="flex-1 min-h-0">
            <Tabs
              activeTab={activeRoute}
              tabs={tabs}
              onClick={(tab) => setActiveRoute(tab)}
              orientation={TabOrientation.Vertical}
            />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-h-0 w-full relative"></div>
      </div>
      <CreateRoute modalState={modalState} onClose={handleModalClose} onCreate={onCreate} />
    </>
  );
};

export default EntityRoutes;
