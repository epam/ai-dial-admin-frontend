import { FC, ReactNode } from 'react';

interface Props {
  title: ReactNode;
  children?: ReactNode;
}

/**
 * The inside of a preview banner: the title over what it has to say, in one column.
 *
 * The notification's own `title` sits beside its message when the two fit on a line and above it when they do not,
 * so a short server message jumped up next to the title and a long one dropped below it. One column says the same
 * thing whatever the message is.
 */
const PreviewBannerBody: FC<Props> = ({ title, children }) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <div className="dial-small-semi text-primary">{title}</div>
    {children}
  </div>
);

export default PreviewBannerBody;
