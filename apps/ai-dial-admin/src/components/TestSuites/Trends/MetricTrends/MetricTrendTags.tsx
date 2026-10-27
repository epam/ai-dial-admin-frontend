'use client';

import classNames from 'classnames';
import { CSSProperties, FC, useCallback, useEffect, useRef, useState } from 'react';

import { Tag, TagAppearance } from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';

import { METRIC_TREND_TAG_MAX_WIDTH_PX } from '@/src/components/TestSuites/Trends/constants';
import { MetricTrendSeries, TrendTagPaletteEntry } from '@/src/components/TestSuites/Trends/models';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { MENU_ACTION_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  series: MetricTrendSeries[];
  tagPalette: TrendTagPaletteEntry[];
  hiddenSeries: Set<string>;
  onToggleSeries: (name: string) => void;
}

const ARROW_BUTTON_CLASS =
  'absolute top-0 z-10 flex size-6 shrink-0 items-center justify-center rounded border border-primary bg-controls-neutral-hover text-primary disabled:opacity-40';

const MetricTrendTags: FC<Props> = ({ series, tagPalette, hiddenSeries, onToggleSeries }) => {
  const t = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const truncate = series.length > 1;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 1;
    setOverflows(hasOverflow);
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      updateScrollState();
      return;
    }

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateScrollState);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [series, updateScrollState]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {overflows && (
        <button
          type="button"
          className={classNames(ARROW_BUTTON_CLASS, 'left-0')}
          aria-label={t(ButtonsI18nKey.Previous)}
          disabled={!canScrollLeft}
          onClick={() => scrollByPage(-1)}
        >
          <IconArrowNarrowLeft {...MENU_ACTION_ICON_PROPS} aria-hidden />
        </button>
      )}
      <div
        ref={scrollRef}
        className={classNames(
          'flex flex-nowrap gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          overflows && 'px-7',
        )}
        onScroll={updateScrollState}
      >
        {series.map((item, index) => {
          const entry = tagPalette[index % tagPalette.length];
          const hidden = hiddenSeries.has(item.name);
          const tagStyle = {
            borderColor: item.color,
            '--tag-bg': entry.fill,
            '--tag-bg-hover': entry.hover,
            ...(truncate ? { maxWidth: METRIC_TREND_TAG_MAX_WIDTH_PX } : null),
          } as CSSProperties;

          return (
            <Tag
              key={item.name}
              label={item.name}
              appearance={TagAppearance.Selectable}
              selected={!hidden}
              onClick={() => onToggleSeries(item.name)}
              icon={<span className="size-[7px] rounded-full" style={{ backgroundColor: item.color }} />}
              className={classNames(
                'h-6 shrink-0 rounded-lg border px-2 dial-tiny-semi-text text-primary',
                'bg-[color:var(--tag-bg)] hover:bg-[color:var(--tag-bg-hover)]',
                hidden && 'opacity-40',
              )}
              style={tagStyle}
            />
          );
        })}
      </div>
      {overflows && (
        <button
          type="button"
          className={classNames(ARROW_BUTTON_CLASS, 'right-0')}
          aria-label={t(ButtonsI18nKey.Next)}
          disabled={!canScrollRight}
          onClick={() => scrollByPage(1)}
        >
          <IconArrowNarrowRight {...MENU_ACTION_ICON_PROPS} aria-hidden />
        </button>
      )}
    </div>
  );
};

export default MetricTrendTags;
