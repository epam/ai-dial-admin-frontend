import { ChangeEvent, FC } from 'react';

import classNames from 'classnames';

interface Props {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  numeric?: boolean;
  // Uppercase label rendered inside the box before the value ("LIMIT 100"-style).
  prefix?: string;
}

// The rail's small boxed text input (aliases, condition values, bucket amounts, limits),
// height-matched to CompactSelect. The ui-kit input has no size this dense, same trade-off as
// CompactSelect. No width in the base classes: Tailwind class order is unpredictable, so a
// caller's w-[44px] could lose against a baked-in w-full — width is the caller's to set.
const CompactInput: FC<Props> = ({ value, onChange, ariaLabel, placeholder, className, numeric, prefix }) => {
  const onChangeValue = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    onChange(numeric ? next.replace(/[^0-9]/g, '') : next);
  };

  const input = (
    <input
      aria-label={ariaLabel}
      inputMode={numeric ? 'numeric' : undefined}
      className={classNames(
        'h-[26px] bg-transparent font-mono dial-tiny-text text-primary outline-none placeholder:text-secondary',
        numeric && 'text-center',
        prefix ? 'min-w-0 flex-1 px-0' : 'rounded border border-primary bg-layer-2 px-2 focus:border-accent-primary',
        !prefix && className,
      )}
      value={value}
      placeholder={placeholder}
      onChange={onChangeValue}
    />
  );

  if (!prefix) return input;

  return (
    <label
      className={classNames(
        'flex h-[26px] items-center gap-2 rounded border border-primary bg-layer-2 px-2 focus-within:border-accent-primary',
        className,
      )}
    >
      <span className="shrink-0 uppercase tracking-wide dial-tiny-text text-secondary">{prefix}</span>
      {input}
    </label>
  );
};

export default CompactInput;
