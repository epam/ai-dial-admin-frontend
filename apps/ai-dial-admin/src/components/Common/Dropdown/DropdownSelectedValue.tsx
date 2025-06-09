import { FC } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  selectedValue?: DropdownItemsModel;
  selectedClassName?: string;
  placeholder?: string;
  isOpen?: boolean;
  prefix?: string;
  isMenu?: boolean;
  multipleValues?: string[];
}

const DropdownSelectedItem: FC<Props> = ({
  selectedValue,
  isOpen,
  placeholder,
  isMenu,
  prefix,
  selectedClassName,
  multipleValues,
}) => {
  const selectedClassNames =
    selectedClassName ||
    classNames('flex flex-row w-full items-center', isMenu ? 'small-medium cursor-pointer' : 'input input-field');
  const selectedValueClassNames = classNames(
    'truncate flex-1 min-w-0 mr-2',
    isMenu ? 'border-b-2bg-accent-primary-alpha border-b-accent-primary border-b-2 py-[13px]' : '',
  );
  return (
    <div className={selectedClassNames} role="menuitem">
      {selectedValue?.name ? (
        <>
          {selectedValue.icon && <span className="mr-2 text-icon-primary">{selectedValue.icon}</span>}
          <span className={selectedValueClassNames}>
            {prefix}
            {selectedValue?.name}
          </span>
        </>
      ) : multipleValues ? (
        <div className="flex flex-1 truncate">
          {multipleValues.map((v) => {
            return (
              <span key={v} className="inline-block rounded border border-icon-secondary p-1 mr-1">
                {v}
              </span>
            );
          })}
        </div>
      ) : (
        <span className="truncate flex-1 min-w-0 mr-2 text-secondary pointer-events-none">{placeholder}</span>
      )}

      {isOpen ? <IconChevronUp {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
    </div>
  );
};

export default DropdownSelectedItem;
