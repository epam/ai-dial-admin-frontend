import { FC, ReactNode } from 'react';

import classNames from 'classnames';
import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  title: string;
  subtitle?: string;
  markerClassName?: string;
  action?: ReactNode;
  // Section-scoped validation hint: a warning icon next to the title, full text in a tooltip.
  warning?: string;
  children: ReactNode;
}

const SectionBlock: FC<Props> = ({ title, subtitle, markerClassName, action, warning, children }) => (
  <section className="flex flex-col gap-2.5 rounded border border-primary bg-layer-3 p-3">
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-baseline gap-2 uppercase tracking-wide text-secondary dial-tiny-semi-text">
        {markerClassName && (
          <span aria-hidden className={classNames('size-2 shrink-0 self-center rounded-sm', markerClassName)} />
        )}
        {title}
        {subtitle && <span className="normal-case tracking-normal text-secondary dial-tiny-text">· {subtitle}</span>}
        {warning && (
          <DialTooltip tooltip={warning} triggerClassName="self-center">
            <span role="img" aria-label={warning} className="flex text-warning">
              <IconAlertTriangle size={14} />
            </span>
          </DialTooltip>
        )}
      </h3>
      <div className="flex items-center gap-1.5">{action}</div>
    </div>
    {children}
  </section>
);

export default SectionBlock;
