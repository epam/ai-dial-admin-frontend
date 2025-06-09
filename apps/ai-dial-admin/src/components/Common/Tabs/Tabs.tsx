'use client';
import { FC, useEffect, useState } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { TabModel } from '@/src/models/tab';
import classNames from 'classnames';
import TabContent from './Tab';

interface Props {
  tabs: TabModel[];
  activeTab: string;
  onClick: (id: string) => void;
  jsonEditorEnabled?: boolean;
}

const Tabs: FC<Props> = ({ tabs, activeTab, onClick, jsonEditorEnabled }) => {
  const staticTabsClassnames = classNames('flex flex-row gap-3', jsonEditorEnabled ? 'hidden' : '');
  const staticDropDownContainerClassNames = classNames(
    'absolute top-0 right-0 left-0 h-[44px] flex items-center bg-layer-3',
    jsonEditorEnabled ? 'hidden' : '',
  );
  const isTablet = useIsTabletScreen();
  const [tabsClassNames, setTabsClassNames] = useState(classNames(staticTabsClassnames, 'hidden'));
  const [mobileTabsClassNames, setMobileTabsClassNames] = useState(
    classNames(staticDropDownContainerClassNames, 'hidden'),
  );

  useEffect(() => {
    setTabsClassNames(classNames(staticTabsClassnames, isTablet || jsonEditorEnabled ? 'hidden' : ''));
    setMobileTabsClassNames(
      classNames(staticDropDownContainerClassNames, !isTablet || jsonEditorEnabled ? 'hidden' : ''),
    );
  }, [isTablet, jsonEditorEnabled, staticDropDownContainerClassNames, staticTabsClassnames]);

  return (
    <>
      <div className={tabsClassNames}>
        {tabs.map((tab) => (
          <TabContent key={tab.id} tab={tab} isActive={activeTab == tab.id} onClick={onClick} />
        ))}
      </div>

      <div className={mobileTabsClassNames}>
        <div className="px-4">
          <Dropdown
            isMenu={true}
            className="w-full flex items-center"
            selectedValue={tabs.find((item) => item.id === activeTab)}
          >
            {tabs.map((item) => (
              <DropdownMenuItem
                key={item.name}
                dropdownItem={item}
                isActiveItem={activeTab == item.id}
                isMenu={true}
                onClick={() => onClick(item.id)}
              />
            ))}
          </Dropdown>
        </div>
      </div>
    </>
  );
};

export default Tabs;
