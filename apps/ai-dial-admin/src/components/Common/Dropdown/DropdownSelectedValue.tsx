import { FC } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  selectedValue?: DropdownItemsModel;
  selectedClassName?: string;
  placeholder?: string;
  isOpen?: boolean;
  prefix?: string;
  disabled?: boolean;
  isMenu?: boolean;
  multipleValues?: string[] | null;
}

const DropdownSelectedItem: FC<Props> = ({
  selectedValue,
  isOpen,
  placeholder,
  isMenu,
  prefix,
  disabled,
  selectedClassName,
  multipleValues,
}) => {
  const selectedClassNames =
    selectedClassName ||
    classNames(
      'flex flex-row w-full items-center',
      isMenu ? 'small-medium cursor-pointer' : 'dial-input px-3 py-2 dial-input-field',
      disabled ? 'dial-input-disable' : '',
    );
  const selectedValueClassNames = classNames(
    'truncate flex-1 min-w-0 mr-2 flex items-center',
    isMenu ? 'border-b-2bg-accent-primary-alpha border-b-accent-primary border-b-2 py-[13px]' : '',
  );
  return (
    <div
      className={selectedClassNames}
      role="menuitem"
      aria-label={selectedValue?.name || multipleValues?.join(', ') || placeholder}
    >
      {selectedValue?.name ? (
        <>
          <DialTooltip tooltip={selectedValue?.name} triggerClassName="flex-1 min-w-0 flex items-center">
            {selectedValue.icon && <span className="mr-2 text-icon-primary">{selectedValue.icon}</span>}
            <span className={selectedValueClassNames}>
              {prefix}
              {selectedValue?.name}
            </span>
          </DialTooltip>
        </>
      ) : multipleValues ? (
        <div className="flex flex-1">
          {multipleValues.map((v) => {
            return (
              <div key={v}>
                <DialTooltip tooltip={v} triggerClassName="flex-1 min-w-0">
                  <span className="inline-block rounded border border-icon-secondary p-1 mr-1">{v}</span>
                </DialTooltip>
              </div>
            );
          })}
        </div>
      ) : (
        <DialTooltip tooltip={placeholder} triggerClassName="flex-1 min-w-0">
          <span className="flex-1 min-w-0 mr-2 text-secondary pointer-events-none">{placeholder}</span>
        </DialTooltip>
      )}

      {isOpen ? <IconChevronUp {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
    </div>
  );
};

export default DropdownSelectedItem;
