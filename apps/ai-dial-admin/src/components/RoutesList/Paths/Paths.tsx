import { FC, useCallback } from 'react';

import { IconPlus, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { RoutesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRoute } from '@/src/models/dial/route';
import Path from './Path';

interface Props {
  route: DialRoute;
  updateRoute: (route: DialRoute) => void;
}

const Paths: FC<Props> = ({ route, updateRoute }) => {
  const t = useI18n();

  const onAddPath = useCallback(() => {
    const newPaths = [...(route.paths || [])];
    newPaths.push('');
    if (newPaths.length === 1) {
      newPaths.push('');
    }
    updateRoute({ ...route, paths: newPaths });
  }, [route, updateRoute]);

  const onRemove = useCallback(
    (index: number) => {
      const newPaths = [...(route.paths || [])];
      if (route.paths?.length === 1) {
        newPaths[index] = '';
      } else {
        newPaths.splice(index, 1);
      }
      updateRoute({ ...route, paths: newPaths });
    },
    [route, updateRoute],
  );

  const onChangePath = useCallback(
    (index: number, value: string) => {
      const newPaths = [...(route.paths || [])];
      newPaths[index] = value;
      updateRoute({ ...route, paths: newPaths });
    },
    [route, updateRoute],
  );

  return (
    <div className="flex flex-col gap-y-3">
      {route.paths == null || route.paths.length === 0 ? (
        <div key="path 0" className="flex items-center">
          <div className="flex-1">
            <TextInputField
              elementId={'path 0'}
              value={''}
              placeholder={t(RoutesI18nKey.PathPlaceholder)}
              fieldTitle={t(RoutesI18nKey.PathTitle)}
              onChange={(value) => onChangePath(0, value)}
            />
          </div>
          <button disabled={true} aria-label="button" className={classNames('cursor-pointer ml-[10px] mt-[20px]')}>
            <IconTrash {...BASE_ICON_PROPS} />
          </button>
        </div>
      ) : (
        route.paths?.map((path, index) => (
          <Path
            key={'path ' + index}
            path={path}
            index={index}
            allPaths={route.paths}
            onRemove={onRemove}
            onChangePath={onChangePath}
          />
        ))
      )}
      <div className="mt-2">
        <Button
          cssClass="secondary"
          title={t(RoutesI18nKey.AddPaths)}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          onClick={onAddPath}
        />
      </div>
    </div>
  );
};

export default Paths;
