import { FC, ReactNode, Ref } from 'react';

import { ErrorText, Label } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { AutocompleteState } from '@/src/components/Common/AutocompleteField/models';
import Suggestions from '@/src/components/Common/Suggestions/Suggestions';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  autocomplete: AutocompleteState;
  children?: ReactNode;
  elementId?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  caption?: string;
  disabled?: boolean;
  isUpperCased?: boolean;
  rowRef?: Ref<HTMLDivElement>;
  rowClassName?: string;
  inputMinWidthClassName?: string;
}

const AutocompleteField: FC<Props> = ({
  autocomplete,
  children,
  elementId,
  label,
  placeholder,
  error = '',
  caption,
  disabled = false,
  isUpperCased,
  rowRef,
  rowClassName,
  inputMinWidthClassName,
}) => (
  <div className={classNames('flex flex-col', label ? 'gap-y-2' : 'gap-y-1', STANDARD_CONTROL_WIDTH)}>
    {label && <Label htmlFor={elementId} label={label} />}
    <div className={classNames('dial-kit-input h-auto min-h-10 py-2 pl-3', error && 'dial-kit-input-error')}>
      <div ref={rowRef} className={classNames('-my-px flex flex-wrap gap-2', rowClassName)}>
        {children}
        <div className={classNames('flex items-center gap-2 flex-1', inputMinWidthClassName)}>
          <input
            id={elementId}
            value={autocomplete.inputValue}
            onChange={autocomplete.onInputChange}
            onBlur={autocomplete.onInputBlur}
            onKeyDown={autocomplete.onKeyDown}
            disabled={disabled}
            className="outline-hidden border-none w-full flex-1 dial-kit-input h-auto"
            placeholder={placeholder || ''}
          />
        </div>
      </div>
    </div>

    {autocomplete.shouldShowSuggestions && (
      <Suggestions
        suggestions={autocomplete.filteredSuggestions}
        highlightIndex={autocomplete.highlight}
        onSelectSuggestion={autocomplete.commit}
        onHightLightSuggestion={autocomplete.onHighlight}
        isUpperCased={isUpperCased}
      />
    )}
    {!disabled && <ErrorText text={error} />}
    {caption && <div className="text-secondary dial-tiny-text pt-2">{caption}</div>}
  </div>
);

export default AutocompleteField;
