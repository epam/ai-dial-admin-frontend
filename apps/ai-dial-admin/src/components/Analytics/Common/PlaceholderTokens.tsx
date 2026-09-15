'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PlaceholderState, PlaceholderToken } from '@/src/models/analytics/pipeline-ui';

interface Props {
  tokens: PlaceholderToken[];
  /** Names the list for assistive technology; the caller draws the visible heading, if any. */
  label: string;
  caption?: string;
}

const STATE_LABEL: Record<PlaceholderState, AnalyticsPipelinesI18nKey> = {
  [PlaceholderState.Covered]: AnalyticsPipelinesI18nKey.PlaceholderCovered,
  [PlaceholderState.Uncovered]: AnalyticsPipelinesI18nKey.PlaceholderUncovered,
  [PlaceholderState.Unused]: AnalyticsPipelinesI18nKey.PlaceholderUnused,
  [PlaceholderState.Available]: AnalyticsPipelinesI18nKey.PlaceholderAvailable,
};

// The trace's chip palette, for the same reason it exists there: one hue per state, stated in words too.
const STATE_CLASS: Record<PlaceholderState, string> = {
  [PlaceholderState.Covered]: 'bg-accent-primary-alpha text-accent-primary',
  [PlaceholderState.Uncovered]: 'bg-error text-error',
  [PlaceholderState.Unused]: 'bg-error text-error',
  [PlaceholderState.Available]: 'bg-layer-4 text-secondary',
};

// Colour alone cannot carry "missing but required" — the marker repeats it in a form a screen reader and
// a colour-blind reader both get. A required name the template already references is not marked: there is
// nothing to act on.
const IS_MARKED_REQUIRED: Record<PlaceholderState, boolean> = {
  [PlaceholderState.Covered]: false,
  [PlaceholderState.Uncovered]: true,
  [PlaceholderState.Unused]: false,
  [PlaceholderState.Available]: false,
};

/**
 * The names a template can reference, each with what the surrounding form knows about it. Reference
 * rather than validation: whether a name is legal depends on the pipeline's trigger, which the service
 * decides, so nothing here blocks a save.
 */
const PlaceholderTokens: FC<Props> = ({ tokens, label, caption }) => {
  const t = useI18n();

  if (!tokens.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-row flex-wrap gap-2 py-0.5" aria-label={label}>
        {tokens.map((token) => (
          <li
            key={token.name}
            className={classNames('rounded px-2 py-0.5 font-mono dial-tiny-semi-text', STATE_CLASS[token.state])}
            aria-label={`${token.name}: ${t(STATE_LABEL[token.state])}`}
          >
            {/* The names say little on their own, so each carries what it renders — on hover and on focus,
                rather than through a `title`, which the keyboard never reaches. */}
            <DialTooltip tooltip={token.description} hideTooltip={!token.description}>
              <span>
                {`{{${token.name}}}`}
                {IS_MARKED_REQUIRED[token.state] && <span className="ml-1">*</span>}
              </span>
            </DialTooltip>
          </li>
        ))}
      </ul>
      {caption && <span className="text-secondary dial-tiny-text">{caption}</span>}
    </div>
  );
};

export default PlaceholderTokens;
