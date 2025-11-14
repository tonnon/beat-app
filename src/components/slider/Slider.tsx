import { forwardRef, useMemo } from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import clsx from 'clsx';
import './slider.scss';

export interface SliderProps {
  readonly id?: string;
  readonly value?: number | null;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly label?: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly marks?: ReadonlyArray<number>;
  readonly showLabel?: boolean;
  readonly onChange?: (value: number) => void;
}

const Slider = forwardRef<HTMLDivElement, SliderProps>((props, forwardedRef) => {
  const {
    id,
    value,
    min = 0,
    max = 100,
    step = 1,
    label,
    description,
    disabled = false,
    marks,
    showLabel = true,
    onChange,
  } = props;

  const resolvedValue = (() => {
    if (value == null || Number.isNaN(value)) {
      return undefined;
    }

    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  })();

  const uniqueMarks = useMemo(() => {
    if (!marks?.length) {
      return [min, max];
    }

    const withinRange = marks
      .map((mark) => Math.round(mark))
      .filter((mark, index, array) => array.indexOf(mark) === index)
      .filter((mark) => mark >= min && mark <= max)
      .sort((a, b) => a - b);

    if (!withinRange.length) {
      return [min, max];
    }

    if (withinRange[0] !== min) {
      withinRange.unshift(min);
    }

    const lastMark = withinRange[withinRange.length - 1];

    if (lastMark !== max) {
      withinRange.push(max);
    }

    return withinRange;
  }, [marks, max, min]);

  const labelId = label && showLabel ? `${id ?? 'slider'}-label` : undefined;
  const descriptionId = description ? `${id ?? 'slider'}-description` : undefined;
  const ariaLabel = label && !showLabel ? label : undefined;

  return (
    <div className={clsx('slider', disabled && 'slider--disabled')}>
      {description ? (
        <div className="slider-description" id={descriptionId}>{description}</div>
      ) : null}

      <RadixSlider.Root
        ref={forwardedRef}
        className="slider-root"
        disabled={disabled}
        value={resolvedValue == null ? undefined : [resolvedValue]}
        defaultValue={[min]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          const [nextValue] = next;

          if (typeof nextValue === 'number' && !Number.isNaN(nextValue)) {
            onChange?.(nextValue);
          }
        }}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        aria-label={ariaLabel}
      >
        <RadixSlider.Track className="slider-track">
          <RadixSlider.Range className="slider-range" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="slider-thumb" aria-label={label ?? 'Slider handle'} />
      </RadixSlider.Root>

      {uniqueMarks.length > 0 ? (
        <div className="slider-marks" aria-hidden="true">
          {uniqueMarks.map((mark) => (
            <span
              key={mark}
              className={clsx('slider-mark', resolvedValue != null && mark === resolvedValue && 'slider-mark--active')}
            >
              {mark}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
});

Slider.displayName = 'Slider';

export default Slider;
