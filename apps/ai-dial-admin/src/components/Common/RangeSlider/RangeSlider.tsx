import classNames from 'classnames';
import React, { ChangeEvent, FC, useState } from 'react';

interface RangeSliderProps {
  title?: string;
  initialValue?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  valueFormatter?: (value: number) => number;
}

const RangeSlider: FC<RangeSliderProps> = ({
  initialValue = 50,
  title,
  min = 0,
  max = 100,
  onChange,
  valueFormatter,
}) => {
  const [value, setValue] = useState<number>(initialValue);

  const handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    setValue(newValue);
    onChange(newValue);
  };
  const backgroundColorFrom = 'var(--bg-accent-primary, #5C8DEA)';
  const backgroundColorTo = 'var(--bg-layer-1, #090D13)';
  const sliderBackground = `linear-gradient(to right, ${backgroundColorFrom} ${value}%, ${backgroundColorTo} ${value}%)`;
  const valueContainer = classNames(
    `small text-primary text-center border border-solid border-primary rounded outline-0 ml-2 py-2 px-1 w-[56px]`,
  );
  return (
    <div>
      <div className="tiny mb-2 text-secondary">{title}</div>
      <div className="flex items-center w-full">
        <input
          id={title}
          style={{ background: sliderBackground }}
          type="range"
          data-testid="range-selector"
          min={min}
          max={max}
          value={value}
          onChange={handleValueChange}
          className="flex-1"
        />
        <div className={valueContainer}>{valueFormatter ? valueFormatter(value) : value}</div>
      </div>
    </div>
  );
};

export default RangeSlider;
