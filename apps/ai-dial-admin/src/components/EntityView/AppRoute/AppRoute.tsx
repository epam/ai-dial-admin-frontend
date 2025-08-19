import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

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
import RouteContent from './RouteContent';

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

  const [activeRouteTab, setActiveRouteTab] = useState<string | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!activeRouteTab) {
      setActiveRouteTab(tabs[0]?.id || '');
    }
  }, [tabs, activeRouteTab]);

  useEffect(() => {
    if (!activeRouteTab) {
      setActiveRouteIndex((routes || []).findIndex((route) => route.name === activeRouteTab));
    }
  }, [activeRouteTab, routes]);

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, []);

  const handleModalOpen = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, []);

  const onChangeRoute = useCallback(
    (route: DialRoute) => {
      if (routes) {
        routes[activeRouteIndex as number] = route;
        onChangeRoutes([...(routes || [])]);
      }
    },
    [activeRouteIndex, onChangeRoutes, routes],
  );

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
        <div className="bg-layer-3 h-full w-[296px] p-4 relative">
          <div className="flex flex-row flex-wrap justify-between items-center mb-6">
            <h1>{t(TabsI18nKey.Routes)}</h1>
            <Button
              cssClass="primary"
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={handleModalOpen}
            />
          </div>
          <div className="flex-1 min-h-0 relative">
            {activeRouteTab && (
              <Tabs
                activeTab={activeRouteTab}
                tabs={tabs}
                onClick={(tab) => setActiveRouteTab(tab)}
                orientation={TabOrientation.Vertical}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col flex-1 min-h-0 w-full relative">
          <RouteContent
            route={routes?.[activeRouteIndex as number] || ({} as DialRoute)}
            onChangeRoute={onChangeRoute}
          />
        </div>
      </div>
      {modalState === PopUpState.Opened && (
        <CreateRoute modalState={modalState} onClose={handleModalClose} onCreate={onCreate} />
      )}
    </>
  );
};

export default EntityRoutes;
