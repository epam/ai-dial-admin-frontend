'use client';

import { FC } from 'react';

import { IconPlus } from '@tabler/icons-react';

import Button from '@/src/components/Common/Button/Button';
import NoData from '@/src/components/Common/NoData/NoData';
import TagInput from '@/src/components/Common/TagInput/TagInput';
import { BasicI18nKey, ButtonsI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import SimpleTypeControls from './SimpleTypeControls';
import { generateControlsFromScheme } from './utils';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  scheme: DialApplicationScheme;
}

const ParametersTab: FC<Props> = ({ scheme }) => {
  const t = useI18n();
  const controls = generateControlsFromScheme(scheme);
  const simpleControlTypes = ['string', 'number', 'boolean'];

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-auto bg-layer-3 p-4">
      {!scheme ? (
        <NoData emptyDataTitle={t(BasicI18nKey.NoParameters)} />
      ) : (
        <div className="flex flex-col gap-6">
          <h1>{t(EntitiesI18nKey.Schema)}</h1>
          <div className="flex flex-col gap-8">
            {controls.map((control) => {
              if (control.type && simpleControlTypes.includes(control.type)) {
                return <SimpleTypeControls key={control.id} control={control} />;
              }

              if (control.type === 'array' && control.itemsTypes?.length === 1) {
                const type = control.itemsTypes[0];
                return (
                  <div key={control.id} className="flex flex-col gap-2">
                    {simpleControlTypes.includes(type) && (
                      <SimpleTypeControls key={control.id} control={{ ...control, type }} />
                    )}
                    {!simpleControlTypes.includes(type) && <div>{control.id}</div>}
                    <div>
                      <Button
                        disable={true}
                        cssClass="tertiary"
                        title={t(ButtonsI18nKey.Add)}
                        iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                      />
                    </div>
                  </div>
                );
              }
              if (control.types?.length) {
                if (control.types.every((t) => t.type === 'string')) {
                  return (
                    <div key={control.id} className="w-[35%]">
                      <TagInput
                        elementId={control.id}
                        fieldTitle={control.label}
                        optional={control.optional}
                        placeholder={t(EntityPlaceholdersI18nKey.Value)}
                        disabled={true}
                      />
                    </div>
                  );
                }
              }
              return <div key={control.id}>{control.label} </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametersTab;
