import { useFloatingTree, useListItem, useMergeRefs } from '@floating-ui/react';
import classNames from 'classnames';
import { ButtonHTMLAttributes, FocusEvent, forwardRef, MouseEvent, ReactNode, useContext } from 'react';

import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { MenuContext } from './DropdownComponent';
import { menuItemClassNames } from './constants';
import { isChecked, isIndeterminate, isMultiSelectClickAvailable } from './utils';

interface DropdownMenuItemProps {
  dropdownItem?: DropdownItemsModel;
  item?: ReactNode;
  disabled?: boolean;
  isActiveItem?: boolean;
  isMenu?: boolean;
  multipleValues?: string[];
  allItemsCount?: number;
  children?: ReactNode;
}

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  function DropdownMenuItem(
    {
      className,
      dropdownItem,
      item: ItemComponent,
      disabled,
      isMenu,
      multipleValues,
      allItemsCount,
      isActiveItem,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const menu = useContext(MenuContext);
    const item = useListItem({ label: disabled ? null : dropdownItem?.id });
    const tree = useFloatingTree();
    const ref = useMergeRefs([item.ref, forwardedRef]);
    const isActive = item.index === menu.activeIndex;

    return children ? (
      <div
        role="menuitem"
        tabIndex={-1}
        {...menu.getItemProps({
          onClick(event: MouseEvent<HTMLButtonElement>) {
            props.onClick?.(event);
            tree?.events.emit('click');
          },
          onFocus(event: FocusEvent<HTMLButtonElement>) {
            props.onFocus?.(event);
            menu.setHasFocusInside(true);
          },
        })}
      >
        {children}
      </div>
    ) : (
      <div>
        <button
          {...props}
          ref={ref}
          type="button"
          role="menuitem"
          aria-label="dropdown-item"
          className={classNames(
            menuItemClassNames,
            isMenu ? 'h-[44px] pl-6' : 'h-[34px]',
            'w-full px-3',
            disabled && '!cursor-not-allowed',
            className,
            isActiveItem ? 'border-l-2 bg-accent-primary-alpha border-l-accent-primary' : '',
          )}
          tabIndex={isActive ? 0 : -1}
          disabled={disabled}
          {...menu.getItemProps({
            onClick(event: MouseEvent<HTMLButtonElement>) {
              // for current multiselect case, we prevent click event for some cases
              if (isMultiSelectClickAvailable(multipleValues, dropdownItem?.id, allItemsCount)) {
                props.onClick?.(event);
              }
              // click on dropdown item close list, for multiselect need to disable this
              if (!multipleValues) {
                tree?.events.emit('click');
              }
            },
            onFocus(event: FocusEvent<HTMLButtonElement>) {
              props.onFocus?.(event);
              menu.setHasFocusInside(true);
            },
          })}
        >
          {ItemComponent}
          {!ItemComponent && dropdownItem && (
            <>
              {dropdownItem.icon && <span className="mr-3 text-icon-secondary">{dropdownItem.icon}</span>}
              {multipleValues ? (
                <div
                  className={classNames(
                    'rounded border ag-checkbox-input-wrapper',
                    multipleValues.some((v) => v === dropdownItem.id) && 'ag-checked',
                    allItemsCount === 1 && 'pointer-events-none opacity-60',
                    isIndeterminate(multipleValues, dropdownItem?.id, allItemsCount) && 'ag-indeterminate',
                    isChecked(multipleValues, dropdownItem?.id, allItemsCount) &&
                      'ag-checked pointer-events-none opacity-60',
                  )}
                ></div>
              ) : (
                <></>
              )}
              <span
                className={classNames(
                  'inline-block truncate small',
                  multipleValues &&
                    (allItemsCount === 1 || isChecked(multipleValues, dropdownItem?.id, allItemsCount)) &&
                    'pointer-events-none opacity-60',
                )}
              >
                {dropdownItem.name}
              </span>
            </>
          )}
        </button>
      </div>
    );
  },
);

export default DropdownMenuItem;
