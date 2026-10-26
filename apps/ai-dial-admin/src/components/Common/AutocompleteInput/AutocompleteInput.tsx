'use client';

import { ElementSize, Input, MenuItem, MenuItemMark, Spinner, useThemeScope } from '@epam/ai-dial-ui-kit';
import { autoUpdate, flip, FloatingPortal, offset, size, useFloating } from '@floating-ui/react';
import classNames from 'classnames';
import { FC, MouseEvent, useId } from 'react';

import { AutocompleteInputProps } from '@/src/components/Common/AutocompleteInput/models';
import { useAutocompleteInput } from '@/src/components/Common/AutocompleteInput/use-autocomplete-input';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

// ui-kit keeps its overlay classes private; these repeat its surface so the list matches `Select`,
// including the 344px cap its option list scrolls under.
const OVERLAY_GAP = 4;
const OVERLAY_MAX_HEIGHT = 344;
const OVERLAY_CLASS_NAME = 'rounded-xl bg-layer-raised p-1 shadow-md flex flex-col gap-0.5';
const SPINNER_SIZE = 16;

const preventBlur = (event: MouseEvent) => event.preventDefault();

/**
 * Single-value counterpart of ui-kit's `AutocompleteTagInput`: the typed text is the value, and the
 * list only suggests. Replace with the kit's own once it ships a single-value combobox.
 */
const AutocompleteInput: FC<AutocompleteInputProps> = ({
  id,
  value,
  suggestions,
  maxSuggestions,
  openOnFocus,
  shouldFilterSuggestions,
  size: fieldSize = ElementSize.Standard,
  labelProps,
  placeholder,
  caption,
  error,
  invalid = false,
  disabled = false,
  readOnly = false,
  isLoading = false,
  ariaLabel,
  listLabel,
  className,
  fieldClassName,
  listClassName,
  onChange,
  onSelect,
  onCommit,
}) => {
  const t = useI18n();
  const generatedId = useId();
  const inputId = id || generatedId;
  const listId = `${inputId}-listbox`;
  const getOptionId = (index: number) => `${listId}-option-${index}`;
  const themeScope = useThemeScope();

  const {
    visibleSuggestions,
    isListOpen,
    activeIndex,
    setHighlight,
    pick,
    onInputChange,
    onInputFocus,
    onInputBlur,
    onInputKeyDown,
  } = useAutocompleteInput({
    value,
    suggestions,
    maxSuggestions,
    openOnFocus,
    shouldFilterSuggestions,
    disabled,
    readOnly,
    onChange,
    onSelect,
    onCommit,
  });

  const { refs, floatingStyles } = useFloating({
    open: isListOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(OVERLAY_GAP),
      flip({ padding: OVERLAY_GAP }),
      size({
        padding: OVERLAY_GAP,
        apply({ rects, availableHeight, elements }) {
          elements.floating.style.width = `${Math.round(rects.reference.width)}px`;
          elements.floating.style.maxHeight = `${Math.min(Math.floor(availableHeight), OVERLAY_MAX_HEIGHT)}px`;
        },
      }),
    ],
  });

  const accessibleListLabel = listLabel ?? (typeof labelProps?.label === 'string' ? labelProps.label : ariaLabel);

  return (
    <>
      <Input
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isListOpen}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
        aria-invalid={invalid || !!error || undefined}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        autoComplete="off"
        iconAfter={isLoading ? <Spinner size={SPINNER_SIZE} ariaLabel={t(BasicI18nKey.Loading)} /> : undefined}
        size={fieldSize}
        labelProps={labelProps}
        placeholder={placeholder}
        caption={caption}
        error={error}
        invalid={invalid}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        wrapperRef={refs.setReference}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        onFocus={onInputFocus}
        onClick={onInputFocus}
        onBlur={onInputBlur}
        containerClassName={className ?? 'w-full'}
        wrapperClassName={fieldClassName}
      />
      <FloatingPortal>
        <div
          ref={refs.setFloating}
          id={listId}
          role="listbox"
          aria-label={accessibleListLabel}
          hidden={!isListOpen}
          style={floatingStyles}
          className={classNames(
            'z-floating overflow-y-auto',
            OVERLAY_CLASS_NAME,
            !isListOpen && 'hidden',
            themeScope,
            listClassName,
          )}
          // Covers the rows, the padding, the gaps and the scrollbar: none of them may blur the input.
          onMouseDown={preventBlur}
        >
          {isListOpen &&
            visibleSuggestions.map((option, index) => (
              <MenuItem
                key={option.value}
                id={getOptionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                tabIndex={-1}
                label={option.label}
                description={option.description}
                mark={MenuItemMark.Tint}
                selected={index === activeIndex}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => pick(option)}
              />
            ))}
        </div>
      </FloatingPortal>
    </>
  );
};

export default AutocompleteInput;
