import { FC, useCallback } from 'react';

import { IconPlus, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityPlaceholdersI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import Path from './Path';

interface Props {
  title: string;
  paths?: string[];
  onChangePaths: (path: string[]) => void;
}

const Paths: FC<Props> = ({ title, paths, onChangePaths }) => {
  const t = useI18n();

  const onAddPath = useCallback(() => {
    const newPaths = [...(paths || [])];
    newPaths.push('');
    if (newPaths.length === 1) {
      newPaths.push('');
    }
    onChangePaths(newPaths);
  }, [paths, onChangePaths]);

  const onRemove = useCallback(
    (index: number) => {
      const newPaths = [...(paths || [])];
      if (paths?.length === 1) {
        newPaths[index] = '';
      } else {
        newPaths.splice(index, 1);
      }
      onChangePaths(newPaths);
    },
    [paths, onChangePaths],
  );

  const onChangePath = useCallback(
    (index: number, value: string) => {
      const newPaths = [...(paths || [])];
      newPaths[index] = value;
      onChangePaths(newPaths);
    },
    [paths, onChangePaths],
  );

  return (
    <div className="flex flex-col gap-y-3">
      {paths == null || paths.length === 0 ? (
        <div key="path 0" className="flex items-center">
          <div className="flex-1">
            <TextInputField
              elementId={'path 0'}
              value={''}
              placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
              fieldTitle={title}
              onChange={(value) => onChangePath(0, value)}
            />
          </div>
          <button disabled={true} aria-label="button" className={classNames('cursor-pointer ml-[10px] mt-[20px]')}>
            <IconTrash {...BASE_ICON_PROPS} />
          </button>
        </div>
      ) : (
        paths?.map((path, index) => (
          <Path
            key={'path ' + index}
            path={path}
            index={index}
            fieldTitle={title}
            allPaths={paths}
            onRemove={onRemove}
            onChangePath={onChangePath}
          />
        ))
      )}
      <div>
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
